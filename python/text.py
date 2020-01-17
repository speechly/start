import sys

from speechly import Speechly


if __name__ == '__main__':
    if len(sys.argv) == 1:
        print('Give app_id as parameter')
        sys.exit(1)
    client = Speechly(sys.argv[1])
    response = client.wlu('book me a restaurant in brooklyn')
    print(response)
