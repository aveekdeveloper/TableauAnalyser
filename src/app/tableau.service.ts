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
    "recipe": "$.workbook.datasources.datasource.($dsid:=$._attributes.name; $dscaption:=$._attributes.caption; $.column.{'DS id':$dsid,'DS caption':$dscaption,'colid':$._attributes.name,'colcaption':$._attributes.caption, 'colformula':$.calculation._attributes.formula})"
  },
  {
    "name":"List all Datasources",
    "description":"Get basic DataSource details",
    "recipe":"$.workbook.datasources.datasource.{'Datasource id':$._attributes.name, 'Datasource caption':$._attributes.caption}"
  },
  {
    "name": "List All datasource Columns",
    "description": "Lists all columns in the datasource",
    "recipe": "$.workbook.datasources.datasource.($dscaption := $._attributes.caption; $dsid := $._attributes.name; $.connection.'metadata-records'.'metadata-record'.{'dscaption':$dscaption,'dsid':$dsid,'remote-name':$.'remote-name'.'#text','local-name':$.'local-name'.'#text'})"
  },
  {
    "name": "List Only Extracted Columns",
    "description": "Lists all extracted columns",
    "recipe": "$.workbook.datasources.datasource.($dscaption := $._attributes.caption; $dsid := $._attributes.name; $.extract.connection.'metadata-records'.'metadata-record'.{'dscaption':$dscaption,'dsid':$dsid,'remote-name':$.'remote-name'.'#text','local-name':$.'local-name'.'#text'})"
  },
  {
    "name": "List Sheets and Columns",
    "description": "Lists all sheets and columns used",
    "recipe": "workbook.worksheets.worksheet.($sheetname := $._attributes.name; $.**.'datasource-dependencies'.($datasource:=$._attributes.datasource; $.column.{'sheet':$sheetname,'ds id':$datasource,'col':$._attributes.caption,'formula':$.calculation._attributes.formula}))"
  },
  {
    "name": "List Dashboards",
    "description" : "Lists all dashboards in workbook",
    "recipe": "workbook.dashboards.dashboard.($dashname := $._attributes.name; $.zones.**.name.{'dashboard': $dashname,'sheet':$})"
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

  handleRecipe(recipe){
    var expression = jsonata(recipe);
    //console.log(expression.evaluate(this.tabFile));
    return expression.evaluate(this.tabFile);
  }

  //Expand a formula by replacing Calculation_*** with the column caption
  expandFormula(formula){

  }
}
