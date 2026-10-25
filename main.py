import game

MAX_ATTEMPTS = 5
POINTS_CORRECT = 15
POINTS_WRONG = -10

_state = {
    "round": 0,
    "max_rounds": 5,
    "total_score": 0,
    "answer": 0,
    "keys": [],
    "attempts": 0,
    "round_score": 0
}

def start_game(max_rounds=5):
    _state["round"] = 0
    _state["max_rounds"] = max_rounds
    _state["total_score"] = 0
    return "Game started."

def start_round():
    if _state["round"] >= _state["max_rounds"]:
        return {"error": "No rounds left."}
    
    _state["round"] += 1
    _state["attempts"] = 0
    _state["round_score"] = 0
    keys, answer = game.pick_random_combo()
    _state["keys"] = keys
    _state["answer"] = answer

    return {
        "round": _state["round"],
        "max_rounds": _state["max_rounds"],
        "keys": keys,
        "attempts_left": MAX_ATTEMPTS
    }

def submit_guess(guess_str):
    if _state["round"] == 0:
        return {"error": "No active round."}
    
    if _state["attempts"] >= MAX_ATTEMPTS:
        return {"error": "No attempts left."}
    
    try:
        guess = int(guess_str)
    except ValueError:
        return {"error": "Please enter a whole number."}
    
    _state["attempts"] += 1
    attempts_left = MAX_ATTEMPTS - _state["attempts"]

    if guess == _state["answer"]:
        _state["round_score"] += POINTS_CORRECT
        _state["total_score"] += _state["round_score"]

        return {
            "result": "correct",
            "message": f"Correct! The answer was {_state['answer']}.",
            "round_score": _state["round_score"],
            "total_score": _state["total_score"],
            "attempts_left": attempts_left, 
        }
    
    _state["round_score"] += POINTS_WRONG

    if attempts_left == 0:
        _state["total_score"] += _state["round_score"]
        
        return {
            "result": "wrong",
            "message": f"Out of attempts. The answer was {_state['answer']}.",
            "round_score": _state["round_score"],
            "total_score": _state["total_score"],
            "attempts_left": 0
        }

    return {
        "result": "wrong",
        "message": f"Wrong guess! Try again.",
        "round_score": _state["round_score"],
        "total_score": _state["total_score"],
        "attempts_left": attempts_left
    }

def get_state():
    return {
        "round": _state["round"],
        "max_rounds": _state["max_rounds"],
        "total_score": _state["total_score"],
        "attempts_left": MAX_ATTEMPTS - _state["attempts"],
    }