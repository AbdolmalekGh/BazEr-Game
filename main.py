import random
import game
score = 0
print("hi, welcome to more mathematics because you love them for some reason:")
while True:
    print(game.color, game.weight, game.clarity, game.quality, game.nationality, sep="\n")
    comp_keys = []
    comp_value = 1
    factors = [game.color, game.weight, game.clarity, game.quality, game.nationality]
    for i in range(5):
        length = len(factors[i])
        rand = random.randint(0, length - 1)
        subject = (list(factors[i].keys()))[rand]
        comp_keys += [subject]
        comp_value *= factors[i][subject]
    print(comp_keys)
    print("can you guess what it is?")
    outcome = game.guessing(comp_value)
    score += outcome
    print(score)
    if str(input(f"do you want to quit?[n, y]")).lower() == "y":
        break
print(score)
