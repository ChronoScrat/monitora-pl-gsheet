# Monitorador de PLs do Congresso Brasileiro no Google Sheets

Olá, bem vindo!

Esse é um monitorador simples de Projetos de Lei (PLs) no Congresso Nacional brasileiro organizado no Google Sheets. A ideia desse monitorador é que o código possa ser rodado automaticamente na própria planilha, utilizando as ferramentas disponibilizadas pelo Google, a fim de garantir que as informações estarão sempre atualizadas.

Esse código foi inicialmente desenvolvido para o núcleo de Advocacy do [Educar Para o Mundo](https://www.instagram.com/coletivo_epm/), um coletivo de cultura e extensão dos alunos do Instituto de Relações Internacionais da Universidade de São Paulo.

## Como instalar

Crie uma planilha no Google Sheets e adicione nela duas folhas: uma chamada "Câmara" e outra chamada "Senado". Em seguida vá em Ferramentas > Editor de Script. Com o editor de scripts aberto, basta criar um arquivo com o código de "atualizaCamara.gs" e outro com o código de "atualizaSenado.gs". A planilha estará pronta para ser rodada.

## Como usar

Em cada uma das folhas, preencher a partir da quinta linha o número do PL que se deseja monitorar na coluna B, e o ano dele na coluna C. Essas informações normalmente estão disponíveis no próprio formato de numeração dos projetos de lei: PL NN/YYYY.

É de fundamental importância que os projetos de lei da Câmara e do Senado sejam preenchidos em suas respectivas folhas!

## Como funciona

O código primeiramente checa as duas folhas a partir da quinta linha e segunda coluna (célula `B6`). A escolha dessa célula se deu por razões puramente estéticas, e pode ser alterada no código de acordo com a preferência do usuário.

Cada vez que o código é rodado, ele passa pelos seguintes passos:

1. Verificar se o PL possui um ID atribuído a ele. Esse ID é exclusivo do sistema interno da Câmara e do Senado.
    - Se sim, o código assume que todas as outras informações sobre o PL já estão preenchidas, e procede para atualizar somente a **Situação Atual** do PL. Se essa situação for diferente da que existia previamente, ele colorirá o fundo da célula em amarelo claro. Em seguida, ele adiciona uma timestamp de quando o processo daquele PL foi concluído.
    - Se não, o código chamará o API da Câmara ou do Senado para preencher as informações não existentes (ID, URL, Autor e Ementa). Em seguida, ele procede a atulizar a situação atual do PL e adiciona um timestamp quando o processo for concluído.
2. Depois de preencher as informações, ele formata elas (muda o esquema de estouro da célula e alinhamento vertical) para garantir melhor leitura.

Para que o PL consiga ser monitorado, é de fundamental importância que ele tenha preenchido o **número** e o **ano** dele. Normalmente, eles são referenciados no PL na forma de PL NN/YYYY.

A escolha de não atualizar as meta-informações do PL caso ele tenha um ID atribuído é arbitrária: ela busca diminuir o número de chamadas ao API da Câmara e do Senado e, assim, reduzir o tempo que o script gasta para ser rodado.

Deve-se sempre garantir que os projetos de lei da Câmara e do Senado estão em suas respectivas folhas, porque eles usam APIs diferentes.

Um dos principais problemas desse código é que ele ainda não possui *error handling*, isto é, caso ele encontre algum problema (por exemplo, ele não consiga atualizar um PL porque a numeração do Senado foi usada na planilha da Câmara), o resto do código não será rodado, e o restante daquela folha não será atualizada.
