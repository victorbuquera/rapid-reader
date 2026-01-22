# Leitor de Velocidade RSVP

## Como testar localmente

1. Inicie um servidor HTTP simples na raiz do projeto:

   ```bash
   python -m http.server 8000
   ```

2. Abra o navegador em `http://localhost:8000/index.html`.

3. Cole um texto no campo e clique em **Carregar texto** ou importe um arquivo
   (`.txt`, `.pdf`, `.epub`, `.mobi`).

> Dica: se o PDF for grande, o processamento pode levar alguns segundos porque a
> extração é feita no navegador.
