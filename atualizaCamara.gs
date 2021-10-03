/** ===== ATUALIZADOR AUTOMÁTICO DE PROJETOS DE LEI =====
 * 
 * 
 * Esse projeto usa duas variáveis, o número do projeto de lei e o ano que ele foi apresentado,
 * para buscar uma série de informações relevantes sobre ele, como a ementa, os autores, a URL,
 * e, mais importante, a situação atual dele.
 * 
 * 
 * @author Nathanael Rolim <nathanael.rolim@usp.br>
 * @version 1.0
 * @license Apache-2.0
 * **/

function atualizaCamara() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(); // Identifica a planilha
  var sheet = ss.getSheetByName("Câmara"); // Identifica a folha
  var rangeData = sheet.getDataRange();
  var lastRow = rangeData.getLastRow();

  // Primeiro, vamos checar se o PL já possui um ID atribuído a ele. O API da Câmara usa esse ID para buscar as informações.
  // O código vai assumir que, se o PL já possuir um ID, as outras informações sobre ele já estão disponíveis. Do contrário, ele vai preenchê-las.
  
  for(i = 5; i <= lastRow; i++){ // Começando na quinta linha (primeira com dados), realizar a operação até a última linha

      // Vamos definir as variáveis das informações
      var num = sheet.getRange(i,2);
      var ano = sheet.getRange(i,3);
      var pID = sheet.getRange(i,4);
      var plURL = sheet.getRange(i,5);
      var autor = sheet.getRange(i,6);
      var ementa = sheet.getRange(i,7);
      var status = sheet.getRange(i,8);
      var timestamp = sheet.getRange(i,9);

      if(pID.isBlank()){

        // Centraliza número e ano
        num.setHorizontalAlignment("center");
        num.setVerticalAlignment("middle");
        ano.setHorizontalAlignment("center");
        ano.setVerticalAlignment("middle");
        
        // Começando por acessar o API
        url = 'https://dadosabertos.camara.leg.br/api/v2/proposicoes?siglaTipo=PL&numero=' + num.getValue() + '&ano=' + ano.getValue() + '&tramitacaoSenado=false&ordem=ASC&ordenarPor=id'; // API da Câmara dos Deputados
        response = UrlFetchApp.fetch(url);
        json = response.getContentText();
        data = JSON.parse(json);

        // Agora vamos pegar e preencher o ID:
        tID = data.dados[0].id;
        pID.setValue(tID);
        pID.setHorizontalAlignment("center");
        pID.setVerticalAlignment("middle");

        // Agora vamos preencher a URL
        tURL = 'https://www.camara.leg.br/propostas-legislativas/' + pID.getValue();
        plURL.setValue(tURL);
        plURL.setHorizontalAlignment("left");
        plURL.setVerticalAlignment("middle");
        plURL.setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);

        // Faremos o mesmo para a ementa
        tEmenta = data.dados[0].ementa;
        ementa.setValue(tEmenta);
        ementa.setHorizontalAlignment("left");
        ementa.setVerticalAlignment("middle");
        ementa.setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

        // Agora vamos fazer um trabalho desgraçado para pegar os autores.

        // Primeiro, vamos acessar a URL com os autores do projeto e buscar as informações
        url = 'https://dadosabertos.camara.leg.br/api/v2/proposicoes/' + pID.getValue() + '/autores';
        response = UrlFetchApp.fetch(url);
        json = response.getContentText();
        data = JSON.parse(json);

        // Agora vamos extrair somente os dados relevantes do JSON obtido (os autores), e organizá-los de acordo com a ordem da assinatura
        autores = data.dados;

        autores = autores.sort(function(a, b){
          return (a['ordemAssinatura'] > b['ordemAssinatura']) ? 1 : ((a['ordemAssinatura'] < b['ordemAssinatura']) ? -1 : 0);
        });

        // Vamos agora definir o texto inicial que irá na célula (necessário para a função seguinte)

        pAutor ='';

        // Agora vamos percorrer cada um dos autores e buscar seu nome. Se o autor for um parlamentar da Câmara, devemos buscar, também, o Partido e a UF dele.

        for(j = 0; j <= autores.length - 1; j++){

          if(data.dados[j].codTipo == 10000){ // Autor parlamentar da Câmara
            tAutor = data.dados[j].nome;

            tURI = data.dados[j].uri;
            respA = UrlFetchApp.fetch(tURI);
            respJ = respA.getContentText();
            datAutor = JSON.parse(respJ);
            tPartido = datAutor.dados.ultimoStatus.siglaPartido;
            tUF = datAutor.dados.ultimoStatus.siglaUf;

            tempAut = tAutor + ' (' + tPartido + '-' + tUF + ')';
            
          } else{ // Autor não-parlamentar da Câmara
            tAutor = data.dados[j].nome;
            tempAut = tAutor;
          };

          if(j == autores.length - 1){ // Não adicionar vírgula para o último
            pAutor = pAutor + tempAut;
          } else{
            pAutor = pAutor + tempAut + ', ';
          };

        };

        // Por fim, vamos preencher o autor
        autor.setValue(pAutor);
        autor.setHorizontalAlignment("left");
        autor.setVerticalAlignment("middle");
        autor.setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);

      };

  // Agora que já lidamos com os projetos que não tem ID, vamos pegar as infos de tramitação

    // Acessaremos o API para buscar as informações
    url = 'https://dadosabertos.camara.leg.br/api/v2/proposicoes/' + pID.getValue();
    response = UrlFetchApp.fetch(url);
    json = response.getContentText();
    data = JSON.parse(json);

    // Montaremos, agora, a última atualização que o projeto sofreu. A mensagem final terá o formato "(dd/mm/yyy) (ÓRGÃO) MENSAGEM"

    // Primeiro pegaremos a data (que está no formato de texto), e a transformaremos para o formato de data do Sheets
    tData = data.dados.statusProposicao.dataHora;
      var year = +tData.substring(0, 4);
      var month = +tData.substring(5, 7);
      var day = +tData.substring(8, 10);
    dataRec = new Date(year, month - 1, day);
    dataUltimaAtu = Utilities.formatDate(dataRec, "GMT-3", "dd/MM/yyyy");

    // Agora pegaremos o órgão atual em que o PL está. Esse órgão é, no geral, uma comissão (e.g.: "CCJ")
    tOrgao = data.dados.statusProposicao.siglaOrgao;

    // Por fim, pegaremos o status da última atualização.
    tStatus = data.dados.statusProposicao.descricaoSituacao;

    // Agora montaremos a mensagem e a atribuiremos ao campo de "Situação Atual"
    tAtual = '(' + dataUltimaAtu + ') (' + tOrgao + ') ' + tStatus

    // Ao atribuir a situação atual, caso a atual seja diferente da anterior, mudar o fundo da célula para destacá-la.

    if(status.getValue() != tAtual){
      status.setValue(tAtual);
      status.setBackground("#faeac7");
    } else{
      status.setValue(tAtual);
      status.setBackground(null);
    };

    status.setHorizontalAlignment("left");
    status.setVerticalAlignment("middle");
    status.setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

    //Por fim, adicionaremos uma estampa de tempo ao final de cada operação.
    timestamp.setValue(Utilities.formatDate(new Date(), "GMT", "dd/MM/yyyy HH:mm:ss"));
    timestamp.setVerticalAlignment("middle");
  };
}
