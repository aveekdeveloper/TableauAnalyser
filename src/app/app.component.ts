import { Component, OnInit } from '@angular/core';

import { UploadEvent, UploadFile } from 'ngx-file-drop';
import {  FileUploader, FileSelectDirective } from 'ng2-file-upload/ng2-file-upload';
import { LocalDataSource } from 'ng2-smart-table';
import { Angular5Csv } from 'angular5-csv/Angular5-csv';
import { TableauService } from './tableau.service';
import * as JSZip from 'jszip';
import * as jsonata from 'jsonata';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'TableauAnalyser';
  selectedRecipe = '';
  showTree : boolean;
  settings = {
    noDataMessage: 'No data found. Please upload a tableau file and select a recipe from the left sidebar.',
    actions: {
      add: false,
      edit: true,
      delete: false,
      position: 'left',
    },
    columns:{},
    edit: {
      editButtonContent: '<div class="btn btn-form btn-default"> <span class="icon icon-pencil"></span></div>',
      saveButtonContent: '<div class="btn btn-form btn-default"> <span class="icon icon-check"></span> </div> ',
      cancelButtonContent: '<div class="btn btn-form btn-default"> <span class="icon icon-cancel"></span> </div>',
    },

    pager: {
      display: false
      //perPage: 20
    }
  };

  csvexportsettings = {
    fieldSeparator: ',',
    quoteStrings: '"',
    decimalseparator: '.',
    showLabels: true,
    headers: []//["Datasource Caption", "Datasource Name", "Col Caption","Col Name","Formula","Description"]
  };

  data: LocalDataSource = new LocalDataSource();
  tableauService : TableauService = new TableauService();

  public files: UploadFile[] = [];

  // Changes XML to JSON
  xmlToJson(xml){

    // Create the return object
    var obj = {};

    if (xml.nodeType == 1) { // element
      // do attributes
      if (xml.attributes.length > 0) {
      obj["_attributes"] = {};
        for (var j = 0; j < xml.attributes.length; j++) {
          var attribute = xml.attributes.item(j);
          obj["_attributes"][attribute.nodeName] = attribute.nodeValue;
        }
      }
    } else if (xml.nodeType == 3) { // text
      obj = xml.nodeValue;
    }

    // do children
    if (xml.hasChildNodes()) {
      for(var i = 0; i < xml.childNodes.length; i++) {
        var item = xml.childNodes.item(i);
        var nodeName = item.nodeName;
        if (typeof(obj[nodeName]) == "undefined") {
          obj[nodeName] = this.xmlToJson(item);
        } else {
          if (typeof(obj[nodeName].push) == "undefined") {
            var old = obj[nodeName];
            obj[nodeName] = [];
            obj[nodeName].push(old);
          }
          obj[nodeName].push(this.xmlToJson(item));
        }
      }
    }
    return obj;
  };

  //Add all fields to columns
  generateColumnSettings(dat){
    var columnSettings = {};
    for (var i=0; i< dat.length;i++){
      var keys = Object.keys(dat[i]);
      for (var j=0 ;j< keys.length ;j++){
        columnSettings[keys[j]] = {
          'title' : keys[j]
        }
      }
    }
    return columnSettings;
  }

  updateTable(final) {
    //save the data in TableauService
    this.tableauService.setTableauFile(final);
    var data = this.tableauService.getColumns();
    this.settings.columns = Object.assign({},this.generateColumnSettings(data));

    //Hack to force Angular to reload the ng2 smart table,
    //angular doesn't call ngOnchange on partial data change
    this.settings = JSON.parse(JSON.stringify(this.settings));
    this.data.load(data);
  }

  handleRecipeClick(recipe){
    this.selectedRecipe = recipe.recipe;
    var data = this.tableauService.handleRecipe(recipe);
    this.settings.columns = Object.assign({},this.generateColumnSettings(data));

    //Hack to force Angular to reload the ng2 smart table,
    //angular doesn't call ngOnchange on partial data change
    this.settings = JSON.parse(JSON.stringify(this.settings));
    this.data.load(data);
  }

  processTWBfile(twbfile){
    let reader = new FileReader();
    reader.onload = () => {
        let text: any = reader.result;
        var parser = new DOMParser();
        var doc = parser.parseFromString(text, "application/xml");
        var final = this.xmlToJson(doc);

        this.updateTable(final);
    }
    reader.readAsText(twbfile);
  }

  processTWBXfile(twbxfile){
    var new_zip = new JSZip();
    const xmlToJson = this.xmlToJson;
    const updateTable = this.updateTable;
    //Compose the twb file name inside the twbx
    //var filename = twbxfile.name.split('.')[0]+".twb";
    new_zip.loadAsync(twbxfile).then((zip) => {
        for(var f in zip.files){
          if(f.split('.').pop() === 'twb'){
            //console.log(f.name);
            //we found our tableau files
            zip.file(f).async("string").then((text) => {
              var parser = new DOMParser();
              var doc = parser.parseFromString(text, "application/xml");
              var final = this.xmlToJson(doc);
              this.updateTable(final);
            });

            break;
          }
        }
    })
  }

  openFile(event) {
    let input = event.target;
    for (var index = 0; index < input.files.length; index++) {
      var tableaufile = input.files[index].name;
      if(tableaufile.split('.').pop() === 'twbx'){
        console.log("Twbx file: "+tableaufile);
        this.processTWBXfile(input.files[index]);
      }else if(tableaufile.split('.').pop() === 'twb'){
        console.log("Twb file:"+tableaufile);
        this.processTWBfile(input.files[index])
      }else{
        console.log("Not tableau file");
        continue;
      }
    };
  }

  exportDataToCsv(){
    const settings = this.csvexportsettings;
    settings.headers = Object.keys(this.settings.columns);
    //console.log(settings);
    this.data.getAll().then(function(result){
      new Angular5Csv(result, 'Twb Report',settings);
    }, function(err){
      alert("No data to export");
    })

  }

  public fileOver(event){
    console.log(event);
  }

  public fileLeave(event){
    console.log(event);
  }


  ngOnInit() {
    this.showTree = false;
 }
}
