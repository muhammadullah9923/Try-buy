# Fal.ai Virtual Try-On Integration

This guide explains how to use the fal.ai virtual try-on service in your SmartCart application.

## Quick Setup

### 1. Install Dependencies

```bash
cd SmartCar_backend/SmartCart
pip install fal-client
```

Or install all requirements:
```bash
pip install -r requirements.txt
```

### 2. Configuration

The fal.ai integration is already configured with the provided API key. The default provider is set to `fal.ai`.

### 3. Environment Variables (Optional)

If you want to use your own fal.ai key, create a `.env` file in `SmartCar_backend/SmartCart/`:

```env
FAL_KEY=your_key_id:your_key_secret
```

Or set it as an environment variable:
```bash
# Windows PowerShell
$env:FAL_KEY = "your_key_id:your_key_secret"

# Linux/macOS
export FAL_KEY="your_key_id:your_key_secret"
```

### 4. How It Works

1. **User uploads photo** in the frontend
2. **Backend receives** user image + product image
3. **Images are converted** to base64 data URIs
4. **Request sent to fal.ai**:
   - Primary model: `fal-ai/idm-vton` (IDM Virtual Try-On)
   - Fallback model: `fashn-ai/tryon` (FASHN Try-On)
5. **Result image** is downloaded and saved
6. **URL returned** to frontend for display

## API Details

### Primary Model: IDM-VTON
- **Endpoint**: `fal-ai/idm-vton`
- **Description**: High-quality virtual try-on using IDM-VTON model
- **Parameters**:
  - `human_image_url`: Base64 data URI or URL of person image
  - `garment_image_url`: Base64 data URI or URL of garment image
  - `description`: Description of the try-on (default: "A person wearing the garment")
  - `num_inference_steps`: Number of inference steps (default: 30)
  - `guidance_scale`: Guidance scale (default: 2.0)

### Fallback Model: FASHN
- **Endpoint**: `fashn-ai/tryon`
- **Description**: Alternative try-on model from FASHN
- **Parameters**:
  - `model_image`: Base64 data URI or URL of person image
  - `garment_image`: Base64 data URI or URL of garment image
  - `category`: Type of garment - "tops", "bottoms", or "one-pieces"

## Testing

1. **Start Django server**:
   ```powershell
   cd SmartCar_backend/SmartCart
   python manage.py runserver
   ```

2. **Start Frontend**:
   ```powershell
   cd SmartCart
   npm run dev
   ```

3. **Test Try-On**:
   - Navigate to homepage
   - Click "Try On" on any product
   - Upload a photo
   - Click "Try It On"
   - View the result

## Troubleshooting

### API Returns Error
- Check your fal.ai key is valid (format: `key_id:key_secret`)
- Verify you have credits in your fal.ai account
- Check fal.ai dashboard for API usage and errors
- Review Django server logs for detailed error messages

### Images Not Processing
- Ensure images are in supported formats (JPEG, PNG)
- Check image sizes (some models have size limits)
- Verify base64 encoding is working correctly
- Make sure images are clear and show the full person/garment

### Fallback to Mock Mode
- If fal.ai API fails, the system automatically falls back to mock mode
- Check Django logs for error details
- Verify network connectivity
- Check if fal.ai service is available

## API Response Handling

The service handles multiple response formats from fal.ai:
- `image` object with `url` key
- `images` array with image objects
- `output_image_url` direct URL
- Direct image URL string

## Cost Considerations

- Check your fal.ai account for pricing
- Monitor API usage in fal.ai dashboard
- Set up usage alerts to avoid unexpected charges
- Consider caching results for repeated requests

## Getting a Fal.ai API Key

1. Visit [fal.ai](https://fal.ai)
2. Sign up for an account
3. Navigate to your dashboard
4. Generate an API key (format: `key_id:key_secret`)
5. Add it to your `.env` file or environment variables

## Model Information

### IDM-VTON
IDM-VTON is a state-of-the-art virtual try-on model that:
- Preserves clothing details accurately
- Maintains natural body poses
- Handles various garment types
- Produces high-quality results

### FASHN Try-On
FASHN is an alternative model that:
- Supports category-based try-on
- Works well with different body types
- Provides fast inference times
