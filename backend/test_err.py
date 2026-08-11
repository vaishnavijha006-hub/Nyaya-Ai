import sys
import traceback

def main():
    try:
        from app.rag.pipeline import ask_rag
        res = ask_rag("How do I file an RTI application?", audience="default", language="en")
        print("Success:", res)
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    main()
