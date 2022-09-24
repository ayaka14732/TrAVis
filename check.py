import torch
import numpy as np
from transformers import BertTokenizer, BertModel

from model import fwd_transformer

tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
s = "I'm saying 'running' this morning! Huggingface"

def get_pt_last_hidden_state():
    model = BertModel.from_pretrained('bert-base-uncased')
    model.eval()
    batch = tokenizer([s], return_tensors='pt')
    input_ids = batch.input_ids
    token_type_ids_pt = torch.zeros_like(input_ids)
    with torch.no_grad():
        output = model(input_ids=input_ids, token_type_ids=token_type_ids_pt, output_hidden_states=True)
    hidden_states = output.hidden_states
    return hidden_states[-1].detach().numpy()

def get_np_last_hidden_state():
    params = np.load('params.npz', allow_pickle=True)['arr_0'][()]
    batch = tokenizer([s], return_tensors='np')
    input_ids = batch.input_ids.astype(np.uint16)
    return fwd_transformer(params, input_ids)

def main():
    print(get_pt_last_hidden_state())
    print(get_np_last_hidden_state())

if __name__ == '__main__':
    main()
