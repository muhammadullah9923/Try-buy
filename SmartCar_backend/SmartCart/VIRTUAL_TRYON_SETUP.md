# Virtual Try-On API Integration Setup

This guide will help you set up the virtual try-on API integration for your SmartCart application.

## Overview

The virtual try-on feature supports multiple API providers:
- **Replicate API** - AI-powered virtual try-on using open-source models
- **Mock Mode** - Simple fallback for testing (no API key required)

## Quick Start

### 1. Install Required Packages

```powershell
cd SmartCar_backend/SmartCart
pip install -r requirements.txt
```

Or if using virtual environment:
```powershell
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure API (Optional - for Real AI Try-On)

#### Option A: Using Replicate API (Recommended)

1. **Sign up for Replicate**:
   - Go to https://replicate.com
   - Create a free account
   - Navigate to https://replicate.com/account/api-tokens
   - Copy your API token

2. **Set up environment variables**:
   - Copy `.env.example` to `.env` in the `SmartCar_backend/SmartCart/` directory
   - Add your Replicate API token:
     ```
     VIRTUAL_TRYON_PROVIDER=replicate
     REPLICATE_API_TOKEN=your_token_here
     ```

#### Option B: Using Mock Mode (No API Key Required)

- Set in `.env`:
  ```
  VIRTUAL_TRYON_PROVIDER=mock
  ```

### 3. Restart Django Server

After configuring, restart your Django server:
```powershell
python manage.py runserver
```

## How It Works

### Request Flow

1. **User uploads photo** in the frontend
2. **Frontend sends** image + product_id to `/api/try-on/`
3. **Backend processes**:
   - If using Replicate: Sends images to AI model for realistic try-on
   - If using Mock: Creates simple composite image
4. **Result returned** as image URL
5. **Frontend displays** the result

### API Models Used

- **Replicate**: Uses `cuuupid/idm-vton` model (IDM-VTON for virtual try-on)
- **Mock**: Simple image overlay (for testing)

## Testing

1. **Start Django server**:
   ```powershell
   python manage.py runserver
   ```

2. **Start Frontend** (in another terminal):
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

### "Replicate API token not configured"
- Check your `.env` file exists and has the correct token
- Ensure `python-dotenv` is installed
- Restart Django server after changing `.env`

### "Replicate package not installed"
- Run: `pip install replicate`

### API Errors
- Check your Replicate API token is valid
- Verify you have API credits/quota
- Check Replicate status: https://status.replicate.com

### Fallback to Mock Mode
- If API fails, the system automatically falls back to mock mode
- Check Django logs for error details

## Cost Considerations

### Replicate API
- Free tier: Limited requests
- Paid: Pay-per-use pricing
- Check current pricing: https://replicate.com/pricing

### Mock Mode
- Free, no API calls
- Simple image processing only

## Advanced Configuration

### Using Different Replicate Models

Edit `store/virtual_tryon_service.py` and change the `model_name`:
```python
# Current
model_name = "cuuupid/idm-vton:latest"

# Alternatives:
# model_name = "levihsu/idm-vton:latest"
# model_name = "cuuupid/idm-vton:main"
```

### Adding Custom API Providers

1. Add a new method in `VirtualTryOnService` class
2. Update `process_try_on()` to handle the new provider
3. Add configuration in `.env`

## Support

For issues or questions:
- Check Django server logs
- Review browser console for frontend errors
- Verify API credentials and quotas

