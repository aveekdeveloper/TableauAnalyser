import { Injectable } from '@angular/core';
import * as jsonata from 'jsonata';

@Injectable({
  providedIn: 'root'
})
export class TableauService {
  tabFile;
  recipes= [
  {
    "name":"List all Formulas",
    "description": "Get column details along with formula and datasource name",
    "recipe": "$.workbook.datasources.datasource.($dsid:=$._attributes.name; $dscaption:=$._attributes.caption; $.column.{'DS id':$dsid,'DS caption':$dscaption,'colid':$._attributes.name,'colcaption':$._attributes.caption, 'colformula':$.calculation._attributes.formula})",
    "columns": ['DS id','DS caption','colid','colcaption','colformula']
  },
  {
    "name":"List all Datasources",
    "description":"Get basic DataSource details",
    "recipe":"$.workbook.datasources.datasource.{'DS id':$._attributes.name, 'DS caption':$._attributes.caption}",
    "columns":['DS id','DS caption']
  },
  {
    "name": "List All datasource Columns",
    "description": "Lists all columns in the datasource",
    "recipe": "$.workbook.datasources.datasource.($dscaption := $._attributes.caption; $dsid := $._attributes.name; $.connection.'metadata-records'.'metadata-record'.{'DS caption':$dscaption,'DS id':$dsid,'remote-name':$.'remote-name'.'#text','local-name':$.'local-name'.'#text'})",
    "columns": ['DS caption','DS id','remote-name','local-name']
  },
  {
    "name": "List Only Extracted Columns",
    "description": "Lists all extracted columns",
    "recipe": "$.workbook.datasources.datasource.($dscaption := $._attributes.caption; $dsid := $._attributes.name; $.extract.connection.'metadata-records'.'metadata-record'.{'DS caption':$dscaption,'DS id':$dsid,'remote-name':$.'remote-name'.'#text','local-name':$.'local-name'.'#text'})",
    "columns": ['DS caption','DS id','remote-name','local-name']
  },
  {
    "name": "List Sheets and Columns",
    "description": "Lists all sheets and columns used",
    "recipe": "workbook.worksheets.worksheet.($sheetname := $._attributes.name; $.**.'datasource-dependencies'.($datasource:=$._attributes.datasource; $.column.{'sheet':$sheetname,'DS id':$datasource,'col caption':$._attributes.caption,'formula':$.calculation._attributes.formula}))",
    "columns": ['sheet','DS id','col caption','formula']
  },
  {
    "name": "List Dashboards",
    "description" : "Lists all dashboards in workbook",
    "recipe": "workbook.dashboards.dashboard.($dashname := $._attributes.name; $.zones.**.name.{'dashboard': $dashname,'sheet':$})",
    "columns": ['dashboard','sheet']
  }
  ];


  constructor(){
  }

  getTableauFile(){
    return this.tabFile;
  }

  setTableauFile(tabFile){
    this.tabFile = tabFile;
  }

  getDatasources(){
    var expression = jsonata("$.workbook.datasources.datasource.{'id':$._attributes.name, 'caption':$._attributes.caption}");
    return expression.evaluate(this.tabFile);
  }

  getColumns(){
    var expression = jsonata("$.workbook.datasources.datasource.($dscaption := $._attributes.caption; $dsid := $._attributes.name; $.connection.'metadata-records'.'metadata-record'.{'dscaption':$dscaption,'dsid':$dsid,'remote-name':$.'remote-name'.'#text','local-name':$.'local-name'.'#text'})");
    return expression.evaluate(this.tabFile);
  }

  getFormulas(){
    var expression = jsonata("$.workbook.datasources.datasource.($dsid:=$._attributes.name; $dscaption:=$._attributes.caption; $.column.{'DS id':$dsid,'DS caption':$dscaption,'colid':$._attributes.name,'colcaption':$._attributes.caption, 'colformula':$.calculation._attributes.formula})");
    return this.replaceCalculationsinFormula(expression.evaluate(this.tabFile));
  }

  handleRecipe(recipe){
    var expression = jsonata(recipe.recipe);
    //console.log(expression.evaluate(this.tabFile));
    var data = expression.evaluate(this.tabFile);

    //Handle additional treatments if needed
    switch(recipe.name){
        case 'List all Formulas':
            //need to replace calculation_xxxxxxxxx fields with the captions
            data = this.replaceCalculationsinFormula(data);
    }

    return data;
  }

  //Expand a formula by replacing Calculation_*** with the column caption
  replaceCalculationsinFormula(data){
      //console.log(data);
      for(var i=0;i<data.length;i++){
          var row = data[i];
          if (row['colid'].includes('Calculation_')){
            //TODO: improve the logic!! This is bullshit logic working in nxnx5
            for(var loop =0 ; loop <5 ; loop++){
              //Stupid hack, to repeat replacement 5 times
              //as sometimes same variable might be used more than once.
              //str.replace works for only 1st occurence
              for(var j=0;j<data.length;j++){
                //replace All the colcaption in all formula columns
                var formula = String(data[j]['colformula']);
                data[j]['colformula'] = formula.replace(row['colid'],row['colcaption']);
            }
          }

          }else{
              continue;
          }

      }
      return data;
  }


}
