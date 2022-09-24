import numpy as np
from scipy.special import softmax

qk_results = []

def gelu(x):
    return 0.5 * x * (1. + np.tanh(x * 0.7978845608028654 * (1. + 0.044715 * x * x)))

def fwd_embedding(params, x):
    # params
    embedding: np.ndarray = params['embedding']  # array
    y = embedding[x]
    return y

def fwd_layer_norm(params, x, eps: float=1e-12):
    # params
    scale: np.ndarray = params['scale']  # array
    bias: np.ndarray = params['bias']  # array

    mean = x.mean(-1, keepdims=True)
    var = x.var(-1, keepdims=True)

    y = ((x - mean) / np.sqrt(var + eps)) * scale + bias

    return y

def fwd_linear(params, x):
    # params
    kernel: np.ndarray = params['kernel']  # array
    bias: np.ndarray = params['bias']  # array

    y = np.dot(x, kernel) + bias

    return y

def fwd_attention(params, src, dst):
    # params
    q_proj = params['q_proj']
    k_proj = params['k_proj']
    v_proj = params['v_proj']
    ff = params['ff']

    _, _, d_k = q_proj['kernel'].shape

    q = np.einsum('bdm,mhk->bdhk', dst, q_proj['kernel'])  # bs, dst_len, n_heads, d_k
    k = np.einsum('bsm,mhk->bshk', src, k_proj['kernel'])  # bs, src_len, n_heads, d_k
    v = np.einsum('bsm,mhv->bshv', src, v_proj['kernel'])  # bs, src_len, n_heads, d_v

    if 'bias' in q_proj:
        q += q_proj['bias']  # bs, dst_len, n_heads, d_k
        k += k_proj['bias']  # bs, src_len, n_heads, d_k
        v += v_proj['bias']  # bs, src_len, n_heads, d_v

    qk = np.einsum('bdhk,bshk->bhds', q, k)  # bs, n_heads, dst_len, src_len
    qk = qk / np.sqrt(d_k)
    qk = softmax(qk, axis=-1)
    qk_results.append(qk)

    qkv = np.einsum('bhds,bshv->bdhv', qk, v)  # bs, dst_len, n_heads, d_v

    output = np.einsum('bdhv,hvm->bdm', qkv, ff['kernel'])  # bs, dst_len, d_ff

    if 'bias' in ff:
        output += ff['bias']  # bs, dst_len, d_ff

    return output

def fwd_transformer_encoder(params, src):
    # params
    self_attn: dict = params['self_attn']  # attention
    self_attn_layer_norm: dict = params['self_attn_layer_norm']  # layer norm
    ff0: dict = params['ff0']  # linear
    ff1: dict = params['ff1']  # linear
    final_layer_norm: dict = params['final_layer_norm']  # layer norm

    src_ = src
    t = fwd_attention(self_attn, src, src)
    t = t + src_
    t = fwd_layer_norm(self_attn_layer_norm, t)

    t_ = t
    t = fwd_linear(ff0, t)
    t = gelu(t)
    t = fwd_linear(ff1, t)
    t = t + t_
    t = fwd_layer_norm(final_layer_norm, t)

    return t

def fwd_transformer(params, src):
    # params
    embedding: dict = params['embedding']  # embedding
    encoder_token_type_embedding: np.ndarray = params['encoder_token_type_embedding']  # array
    encoder_embed_positions: np.ndarray = params['encoder_embed_positions']  # array
    encoder_embed_layer_norm: dict = params['encoder_embed_layer_norm']  # layer norm
    encoder_layers: list = params['encoder_layers']  # list of transformer encoder

    _, width_enc = src.shape

    src = fwd_embedding(embedding, src)
    src = src + encoder_token_type_embedding[0]  # `token_type_id` is always 0
    src = src + encoder_embed_positions[:width_enc]
    src = fwd_layer_norm(encoder_embed_layer_norm, src)

    for encoder_layer in encoder_layers:
        src = fwd_transformer_encoder(encoder_layer, src)

    return src
