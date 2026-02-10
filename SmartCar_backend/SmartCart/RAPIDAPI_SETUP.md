# Virtual Try-On Integration (DEPRECATED)

> **⚠️ NOTICE: This documentation is outdated.**
> 
> The virtual try-on feature has been migrated from RapidAPI to **fal.ai**.
> 
> Please see **[FAL_AI_SETUP.md](FAL_AI_SETUP.md)** for the current integration guide.

---

## Migration Notes

The SmartCart application now uses fal.ai for virtual try-on functionality instead of RapidAPI. 

### Key Changes:
- **Old Provider**: RapidAPI (virtual-try-on2, IDM-VTON, Kolors)
- **New Provider**: fal.ai (fal-ai/idm-vton, fashn-ai/tryon)

### Benefits of fal.ai:
- Better quality results
- More reliable API
- Simpler authentication
- Better documentation

### To migrate:
1. Install `fal-client` package: `pip install fal-client`
2. Set your `FAL_KEY` environment variable
3. The code has already been updated to use fal.ai

See [FAL_AI_SETUP.md](FAL_AI_SETUP.md) for complete setup instructions.

## Alternative Providers

You can switch to other providers by setting `VIRTUAL_TRYON_PROVIDER`:
- `rapidapi` - RapidAPI service (default)
- `replicate` - Replicate AI models
- `mock` - Simple mock/fallback mode

## Support

For issues:
- Check Django server logs
- Review RapidAPI dashboard for API status
- Verify API key and subscription status

