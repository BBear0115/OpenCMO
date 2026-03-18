import asyncio

from dotenv import load_dotenv
from agents import Runner

from opencmo.agents.cmo import cmo_agent


async def run_cli():
    print("=" * 60)
    print("  OpenCMO - Your AI Chief Marketing Officer")
    print("  Type a product URL and what you need, or 'quit' to exit.")
    print("=" * 60)
    print()

    input_items = []

    while True:
        try:
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break

        if not user_input:
            continue
        if user_input.lower() in ("quit", "exit", "q"):
            print("Goodbye!")
            break

        input_items.append({"role": "user", "content": user_input})

        print("\nCMO is working...\n")
        result = await Runner.run(cmo_agent, input_items)

        print(f"[{result.last_agent.name}]")
        print(result.final_output)
        print()

        input_items = result.to_input_list()


def main():
    load_dotenv()
    asyncio.run(run_cli())


if __name__ == "__main__":
    main()
