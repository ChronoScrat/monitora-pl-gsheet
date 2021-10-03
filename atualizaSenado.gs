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

function atualizaSenado() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Senado");
  var rangeData = sheet.getDataRange();
  var lastRow = rangeData.getLastRow();

// Primeiro, vamos checar se o PL já possui um ID atribuído a ele. Embora o API do Senado não necessite dele para realizar as buscas, ele é útil para o link das matérias.
  
  for(i = 5; i <= lastRow; i++){

      // Vamos definir as variáveis das informações
      var num = sheet.getRange(i,2);
      var ano = sheet.getRange(i,3);
      var caguei = sheet.getRange(i,4);
      var plURL = sheet.getRange(i,5);
      var autor = sheet.getRange(i,6);
      var ementa = sheet.getRange(i,7);
      var status = sheet.getRange(i,8);
      var timestamp = sheet.getRange(i,9);


      if(caguei.isBlank()){
        
        // Com um esforço do caralho, acessar esse API horrível em XML ruim e imparseável
        url =  'https://legis.senado.leg.br/dadosabertos/materia/pesquisa/lista?sigla=pl&ano=' + ano.getValue() + '&numero=' + num.getValue() + '&formato=json'; // API do Senado
        response = UrlFetchApp.fetch(url);
        xml = response.getContentText();
        data = XmlService.parse(response).getAllContent();

        caminho = data[0].getChild("Materias").getChild("Materia");

        // Centraliza número e ano

        num.setHorizontalAlignment("center");
        num.setVerticalAlignment("middle");
        ano.setHorizontalAlignment("center");
        ano.setVerticalAlignment("middle");

        // Pegar o ID da matéria
        tID = caminho.getChild("IdentificacaoMateria").getChild("CodigoMateria").getText();
        
        caguei.setValue(tID);
        caguei.setHorizontalAlignment("center");
        caguei.setVerticalAlignment("middle");

        // Agora vamos preencher a URL

        tURL = 'https://www25.senado.leg.br/web/atividade/materias/-/materia/' + tID;

        plURL.setValue(tURL);
        plURL.setHorizontalAlignment("left");
        plURL.setVerticalAlignment("middle");
        plURL.setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);

        // Agora vamos preencher os autores

        tAutor = caminho.getChild("AutoresPrincipais").getChild("AutorPrincipal").getChild("IdentificacaoParlamentar").getChild("NomeParlamentar").getText();
        tAutCod = caminho.getChild("AutoresPrincipais").getChild("AutorPrincipal").getChild("IdentificacaoParlamentar").getChild("SiglaTipoAutor").getText();

        // Pegar o partido e a UF, caso o autor seja um senador, ou somente o nome caso não seja

        if(tAutCod == 'SENADOR'){
          tPartido = caminho.getChild("AutoresPrincipais").getChild("AutorPrincipal").getChild("IdentificacaoParlamentar").getChild("SiglaPartidoParlamentar").getText();
          tUF = caminho.getChild("AutoresPrincipais").getChild("AutorPrincipal").getChild("IdentificacaoParlamentar").getChild("UfParlamentar").getText();

          pAutor = tAutor + ' (' + tPartido + '-' + tUF + ')';
        } else{
          pAutor = tAutor;
        }

        autor.setValue(pAutor);
        autor.setHorizontalAlignment("left");
        autor.setVerticalAlignment("middle");
        autor.setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

        // Por fim, vamos preencher a ementa

        tEmenta = caminho.getChild("DadosBasicosMateria").getChild("EmentaMateria").getText();

        ementa.setValue(tEmenta);
        ementa.setHorizontalAlignment("left");
        ementa.setVerticalAlignment("middle");
        ementa.setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

      };

      // Com um esforço do caralho, acessar esse API horrível em XML ruim e imparseável
      url =  'https://legis.senado.leg.br/dadosabertos/materia/pesquisa/lista?sigla=pl&ano=' + ano.getValue() + '&numero=' + num.getValue() + '&formato=json'; // API da Câmara dos Deputados
      response = UrlFetchApp.fetch(url);
      xml = response.getContentText();
      data = XmlService.parse(response).getAllContent();

      caminho = data[0].getChild("Materias").getChild("Materia").getChild("SituacaoAtual").getChild("Autuacoes").getChild("Autuacao");

      // Montaremos, agora, a última atualização que o projeto sofreu. A mensagem final terá o formato "(dd/mm/yyy) (XXX) MENSAGEM"

      // Primeiro pegaremos a data (que está no formato de texto), e a transformaremos para o formato de data do Sheets

      tData = caminho.getChild("Local").getChild("DataLocal").getText();
          var year = +tData.substring(0, 4);
          var month = +tData.substring(5, 7);
          var day = +tData.substring(8, 10);
        dataRec = new Date(year, month - 1, day);
        dataUltimaAtu = Utilities.formatDate(dataRec, "GMT-3", "dd/MM/yyyy");

      // Agora pegaremos o órgão atual em que o PL está. Esse órgão é, no geral, uma comissão (e.g.: "CCJ")

      tOrgao = caminho.getChild("Local").getChild("SiglaLocal").getText();

      // Por fim, pegaremos o status da última atualização. No entanto, como o API do Senado é horrível, a coisa mais péssima que já foi feita na história, alguns PLs não têm o status. Nesse caso, temos que aplicar um filtro.

      if(caminho.getChild("Situacoes") != null){
          tStatus = caminho.getChild("Situacoes").getChild("Situacao").getChild("DescricaoSituacao").getText();
          tAtual = '('+ dataUltimaAtu + ') (' + tOrgao + ') ' + tStatus;
        } else{
          tAtual = '('+ dataUltimaAtu + ') (' + tOrgao + ')  Sem informação de situação'
        };

        // Para atribuir a situação atual, caso a atual seja diferente da anterior, mudaremos o fundo da célula para destacá-la.

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
