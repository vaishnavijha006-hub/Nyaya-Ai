import asyncio
from app.services.legal_analysis_engine import run_legal_analysis
import logging
logging.basicConfig(level=logging.DEBUG)

async def main():
    try:
        res = await run_legal_analysis({}, 'Explain my rights as a consumer for a refund')
        print('RESULT:')
        print(res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(main())
