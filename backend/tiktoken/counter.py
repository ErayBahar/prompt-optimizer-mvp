#imports
import tiktoken

default_enc = "cl100k_base"

#count prompt tokens
def count(prompt, encoding=default_enc):
    enc = tiktoken.get_encoding(encoding)

    #count tokens
    token_count = len(enc.encode(prompt))

    #get tokens
    token_list = []
    for t in enc.encode(prompt):
        token = enc.decode([t])
        token_list.append(token)
    
    #write data into dict
    prompt_data = {
        "prompt": prompt,
        "token_count" : token_count,
        "tokens" : token_list,
    }
    return prompt_data

#example
prompt = "can you please explain to me some linear algebra"
data = count(prompt)
print(data)