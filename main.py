import numpy as np
from word_piece_tokenizer import WordPieceTokenizer

import model

tokenizer = WordPieceTokenizer()
params = np.load('params.npz', allow_pickle=True)['arr_0'][()]

def run(s: str) -> tuple[list[list[list[list[float]]]], list[str]]:
    token_ids = tokenizer.tokenize(s)
    input_ids = np.array([token_ids], dtype=np.uint16)
    tokens = [tokenizer._convert_id_to_token(i) for i in token_ids]

    model.qk_results = []
    model.fwd_transformer(params, input_ids)

    qk_results = [qk_result[0].tolist() for qk_result in model.qk_results]

    return qk_results, tokens

run
