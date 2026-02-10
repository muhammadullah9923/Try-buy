import os
import requests
import base64
import time
from io import BytesIO
from PIL import Image
import logging
from pathlib import Path
from django.conf import settings

# Load .env file for API keys
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent.parent / '.env'
    load_dotenv(env_path)
except ImportError:
    pass  # dotenv not installed

# Import fal_client
try:
    import fal_client
    FAL_CLIENT_AVAILABLE = True
except ImportError:
    FAL_CLIENT_AVAILABLE = False

logger = logging.getLogger(__name__)

class VirtualTryOnService:
    """
    Virtual Try-On Service using Fal.ai API.
    Fast cloud-based inference (~15 seconds per image).
    """
    
    def __init__(self):
        # Get API key from environment
        self.api_key = os.getenv('FAL_KEY', '9dbc353a-781b-41f2-8a06-7574da223d4d:2806394f13eafb33c846987c410bd650')
        
        # Set the API key in environment for fal_client
        if self.api_key:
            os.environ['FAL_KEY'] = self.api_key
        
        # Ensure media directory for results exists
        self.result_dir = os.path.join(settings.MEDIA_ROOT, 'tryon', 'results')
        os.makedirs(self.result_dir, exist_ok=True)
        
        if not self.api_key:
            logger.warning("FAL_KEY not found in environment. Please set it in .env file.")
        else:
            logger.info(f"FAL_KEY loaded successfully")
            
        if not FAL_CLIENT_AVAILABLE:
            logger.warning("fal-client not installed. Run: pip install fal-client")

    def _image_to_data_uri(self, image):
        """Convert PIL Image or file to base64 data URI"""
        if hasattr(image, 'read'):
            # It's a file-like object
            img = Image.open(image)
        else:
            img = image
            
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize to reasonable size for API (max 1024)
        max_size = 1024
        img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=90)
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        
        return f"data:image/jpeg;base64,{img_base64}"

    def _upload_to_fal(self, image_data_uri):
        """Upload image to Fal.ai and get URL (alternative to data URI)"""
        # For now, we'll use data URI directly which Fal.ai supports
        return image_data_uri

    def process_try_on(self, user_image, product_image_url, product_id=None, provider=None):
        """
        Process virtual try-on using Fal.ai API with fal_client library.
        """
        if not self.api_key:
            return {
                "success": False,
                "message": "FAL_KEY not configured. Please add FAL_KEY to your .env file."
            }
        
        if not FAL_CLIENT_AVAILABLE:
            return {
                "success": False,
                "message": "fal-client not installed. Run: pip install fal-client"
            }
        
        try:
            logger.info("Starting Fal.ai Virtual Try-On...")
            
            # 1. Prepare human image (user photo)
            logger.info("Preparing person image...")
            person_image_uri = self._image_to_data_uri(user_image)
            
            # 2. Prepare garment image
            logger.info("Preparing clothing image...")
            if product_image_url.startswith('http'):
                # Download and convert to data URI
                resp = requests.get(product_image_url)
                garment_img = Image.open(BytesIO(resp.content))
                clothing_image_uri = self._image_to_data_uri(garment_img)
            elif product_image_url.startswith('data:'):
                # Already a data URI
                clothing_image_uri = product_image_url
            else:
                # Local file path
                if product_image_url.startswith('/media/'):
                    rel_path = product_image_url.lstrip('/')
                    product_image_path = os.path.join(settings.BASE_DIR, rel_path)
                else:
                    product_image_path = product_image_url
                garment_img = Image.open(product_image_path)
                clothing_image_uri = self._image_to_data_uri(garment_img)
            
            # 3. Call Fal.ai using fal_client
            logger.info("Submitting to Fal.ai IDM-VTON API using fal_client...")
            
            def on_queue_update(update):
                if isinstance(update, fal_client.InProgress):
                    for log in update.logs:
                        logger.info(f"Fal.ai: {log.get('message', '')}")
            
            result = fal_client.subscribe(
                "fal-ai/idm-vton",
                arguments={
                    "human_image_url": person_image_uri,
                    "garment_image_url": clothing_image_uri,
                    "description": "A person wearing the clothing"
                },
                with_logs=True,
                on_queue_update=on_queue_update,
            )
            
            logger.info(f"Fal.ai result: {result}")
            
            # 4. Extract result image
            result_image_url = None
            if 'images' in result and len(result['images']) > 0:
                result_image_url = result['images'][0].get('url')
            elif 'image' in result and 'url' in result['image']:
                result_image_url = result['image']['url']
            
            if result_image_url:
                logger.info(f"Got result image: {result_image_url}")
                
                # Download and save locally
                img_resp = requests.get(result_image_url)
                result_image = Image.open(BytesIO(img_resp.content))
                
                filename = f"fal_vto_{product_id or 'ext'}_{os.urandom(4).hex()}.png"
                output_path = os.path.join(self.result_dir, filename)
                result_image.save(output_path)
                
                local_url = f"{settings.MEDIA_URL}tryon/results/{filename}"
                
                return {
                    "success": True,
                    "result_image_url": local_url,
                    "message": "Virtual try-on completed successfully"
                }
            else:
                logger.error(f"Unexpected response format: {result}")
                return {
                    "success": False,
                    "message": "Invalid response from API"
                }

        except Exception as e:
            logger.error(f"Error in process_try_on: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return {
                "success": False,
                "message": f"Try-on failed: {str(e)}"
            }
