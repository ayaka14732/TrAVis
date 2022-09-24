import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from word_piece_tokenizer import WordPieceTokenizer

import model

tokenizer = WordPieceTokenizer()
params = np.load('params.npz', allow_pickle=True)['arr_0'][()]

s = 'The rich white-collar worker from Costa Rica said his bamboo forest has been destroyed in a big fire.'
token_ids = tokenizer.tokenize(s)
input_ids = np.array([token_ids], dtype=np.uint16)
tokens = [tokenizer._convert_id_to_token(i) for i in token_ids]

model.qk_results = []
model.fwd_transformer(params, input_ids)

# len(model.qk_results)  # 12 layers
# len(model.qk_results[0])  # 12 heads

layer = 6
head = 3
a = model.qk_results[layer][0, head]
ax = sns.heatmap(a, cmap='YlGnBu', xticklabels=tokens, yticklabels=tokens)
ax.tick_params(axis='both', labelsize=10, labelbottom=False, bottom=False, top=False, labeltop=True)
plt.show()
