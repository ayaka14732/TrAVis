import jax
import numpy as np
from transformers import BertModel

def dotted_dict2nested_dict(params):
    d = {}
    for kx, v in params.items():
        ks = kx.split('.')
        i = d
        for k in ks[:-1]:
            i = i.setdefault(k, {})
        i[ks[-1]] = v
    return d

def convert_qkv(params):
    return {
        'kernel': params['weight'].T.reshape(768, 12, 64),
        'bias': params['bias'].reshape(12, 64),
    }

def convert_ff(params):
    return {
        'kernel': params['weight'].T.reshape(12, 64, 768),
        'bias': params['bias'],
    }

def convert_linear(params):
    return {
        'kernel': params['weight'].T,
        'bias': params['bias'],
    }

def convert_layer_norm(params):
    return {
        'scale': params['weight'],
        'bias': params['bias'],
    }

def convert_transformer_encoder(params):
    return {
        'self_attn': {
            'q_proj': convert_qkv(params['attention']['self']['query']),
            'k_proj': convert_qkv(params['attention']['self']['key']),
            'v_proj': convert_qkv(params['attention']['self']['value']),
            'ff': convert_ff(params['attention']['output']['dense']),
        },
        'self_attn_layer_norm': convert_layer_norm(params['attention']['output']['LayerNorm']),
        'ff0': convert_linear(params['intermediate']['dense']),
        'ff1': convert_linear(params['output']['dense']),
        'final_layer_norm': convert_layer_norm(params['output']['LayerNorm']),
    }

def pt2numpy(params):
    params = dotted_dict2nested_dict(params)
    params = jax.tree_map(lambda x: x.detach().numpy(), params)
    params = {
        'embedding': {'embedding': params['embeddings']['word_embeddings']['weight']},
        'encoder_token_type_embedding': params['embeddings']['token_type_embeddings']['weight'],
        'encoder_embed_positions': params['embeddings']['position_embeddings']['weight'],
        'encoder_embed_layer_norm': convert_layer_norm(params['embeddings']['LayerNorm']),
        'encoder_layers': [convert_transformer_encoder(params['encoder']['layer'][str(i)]) for i in range(12)],
    }
    return params

def main():
    model = BertModel.from_pretrained('bert-base-uncased')
    params = pt2numpy(dict(model.named_parameters()))
    np.savez_compressed('params.npz', params)

if __name__ == '__main__':
    main()
