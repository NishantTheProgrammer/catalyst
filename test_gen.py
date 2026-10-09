def gen():
    try:
        raise ValueError("crash!")
    except Exception as e:
        yield "Sorry!"

for x in gen():
    print("GOT:", x)
