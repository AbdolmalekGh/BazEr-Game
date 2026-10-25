DATA = {
    "weight": {"large": 150, "medium": 100, "small": 50},
    "quality": {"normal": 200, "high": 300},
    "color": {"red": 2, "green": 3, "blue": 4, "white": 6},
    "clarity": {"Transparent": 100, "Opaque": 200},
    "nationality": {"African": 10, "European": 100, "Asian": 50} 
}

def get_data():
    return DATA

def pick_random_combo():
    import random

    keys = []
    value = 1

    for feature in DATA.values():
        key = random.choice(list(feature.keys()))
        keys.append(key)
        value *= feature[key]

    return keys, value