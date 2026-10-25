weight = {"large": 150, "medium": 100, "small": 50}
quality = {"normal": 200, "high": 300}
color = {"red": 2, "green": 3, "blue": 4, "white": 6}
clarity = {"Transparent": 100, "Opaque": 200}
nationality = {"African": 10, "European": 100, "Asian": 50}


def guessing(answer):
    score = 0
    while True:
        guess = float(input())
        if guess == answer:
            score += 15
            print(score)
            print("your guess is right. thank you for playing the game.")
            break
        elif guess != answer:
            score -= 10
            print(score)
            print("your guess is wrong . please try again: ")
    return score
