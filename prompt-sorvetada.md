# Prompt: jogo Sorvetada

Crie um jogo estilo Bomberman para navegador, em HTML, CSS e JavaScript puro (sem frameworks nem bibliotecas), chamado **Sorvetada**. Tema: sorveteria em pixel art.

## Estrutura do projeto

- Arquivos: `index.html`, `style.css`, `game.js` e a pasta `assets/`.
- Em `assets/` ficam duas imagens: `personagens.png` (10 sorvetinhos, 5 colunas x 2 linhas, fundo branco) e `viloes.png` (os 5 vilões e o chefão, fundo azul-escuro).
- Faça um script (Node ou Python) que recorte os sprites dessas imagens, remova o fundo e salve cada um como PNG 64x64 transparente em `assets/sprites/`. O jogo deve carregar esses arquivos.

## Mapa e regras básicas

- Canvas 600x520, grade de 15x13 casas de 40px, movimento casa a casa (um passo a cada 130 ms enquanto a tecla estiver pressionada).
- Paredes fixas de chocolate nas bordas e nas posições em que x e y são pares. Blocos de gelo destrutíveis em cerca de 60% das casas livres, deixando livre a área inicial de cada jogador.
- Bomba em forma de cereja: explode em 2 s, alcance de 2 casas nas 4 direções, para nas paredes, destrói blocos de gelo e detona outras bombas em cadeia. A chama dura 450 ms (cor rosa). Cada jogador pode ter até 2 bombas ao mesmo tempo.
- Quem tocar na chama ou em um monstro perde 1 vida e fica invulnerável por 1,6 s (piscando), voltando ao ponto inicial. Cada jogador começa com 3 vidas.

## Vilões

Movimento aleatório a cada 380 ms, cada um com um poder:

- **Gelo Vivo:** atira cristais de gelo em linha reta quando vê o jogador; quem for atingido fica congelado por 1,6 s.
- **Sorvete Derretido:** deixa poças rosa por 7 s; pisar nelas deixa o jogador mais lento.
- **Waffle Maligno:** quando o jogador está na mesma linha ou coluna (até 6 casas e sem obstáculos), faz uma investida de até 3 casas.
- **Picolé Fantasma:** fica semitransparente e atravessa blocos de gelo e bombas.
- **Sorvete Guardião:** tem escudo e precisa de 2 explosões para morrer.
- **Chefão** (a cada 3ª fase, só no modo 1 jogador): aguenta 3 explosões, anda mais devagar e chama um Sorvete Derretido de reforço a cada poucos segundos (máximo de 9 inimigos).
- Cada explosão só causa dano a um mesmo inimigo uma vez a cada 700 ms.

## Cristais de gelo

- Dão +50 pontos ao serem pegos, andando em cima.
- Aparecem quando um bloco é destruído (40% de chance), quando um monstro morre e também sozinhos a cada 5 s, com no máximo 5 no mapa.

## Pontuação

- Bloco destruído: +10. Monstro: +100. Chefão: +500. Fase concluída: +100 por jogador (+200 no modo solo). Os pontos vão para o dono da bomba.
- Ao eliminar todos os monstros, a fase seguinte começa, com mais monstros (mantendo vidas e pontos).

## Modos de jogo

- **1 jogador:** setas ou WASD para andar, Espaço para soltar a bomba. Mostrar também botões de toque na tela (direcionais e "Soltar cereja") para celular.
- **2 jogadores (duelo no mesmo teclado):** J1 usa WASD + Espaço; J2 usa setas + Enter. O mapa é simétrico (J1 começa no canto superior esquerdo e J2 no inferior direito). Explodir o rival dá +300 pontos, e a bomba também machuca quem a soltou. Os monstros continuam atacando os dois, sem chefão. Quem ficar sem vidas perde, e a tela final mostra o vencedor e o placar.
- Seleção de modo e de sabor (qual dos 10 sorvetinhos cada jogador usa) na parte de cima da página.
- Tela de fim de jogo: reiniciar com Enter ou toque.

## Visual

- Chão azul-arroxeado xadrez, paredes de chocolate, blocos de gelo azul-claro, cristais ciano brilhantes.
- Sprites desenhados com `image-rendering: pixelated`, monstros com leve balanço, fonte Fredoka (Google Fonts) com fallback sans-serif.
- Página responsiva, com tema claro e escuro e botões acessíveis com foco visível.

## Código

- Separe a lógica em funções claras (`init`, `update`, `draw`, `boom`, `hurt` etc.), com comentários curtos em português.
- No fim, explique como rodar (por exemplo, com a extensão Live Server ou `npx serve`) e liste onde ficam as constantes fáceis de ajustar (velocidade, alcance, tempo da bomba, vidas).
