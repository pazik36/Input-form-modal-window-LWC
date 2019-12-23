import { LightningElement,wire, track } from 'lwc';
import insertParentChildRel from '@salesforce/apex/ParentChildRelationCtrl.insertParentChildRel';
import getAllInventory from '@salesforce/apex/ParentChildRelationCtrl.getAllInventory';
import getObjects from '@salesforce/apex/ParentChildRelationCtrl.getObjects';
import getFields from '@salesforce/apex/ParentChildRelationCtrl.getFields';
import deleteInventories from '@salesforce/apex/ParentChildRelationCtrl.deleteInventories';
import { refreshApex } from '@salesforce/apex';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';
 
const actions = [
  { label: 'Edit', name: 'edit' },
  { label: 'Delete', name: 'delete' },
];

const columns = [
  {label: 'Label',fieldName: 'bhdata__Label__c',type: 'text',sortable: true},
  {label: 'Object Api Name',fieldName: 'bhdata__ObjectApiName__c',type: 'text',sortable: true},
  {label: 'Active',fieldName: 'bhdata__Active__c',type: 'boolean'},
  {label: 'Include in SOSL',fieldName: 'bhdata__Include_in_SOSL__c',type: 'boolean'},
  {label: 'Record Identifiere',fieldName: 'bhdata__RecordIdentifierApiName__c',type: 'text',sortable: true},
  {
    type: 'action',
    typeAttributes: { rowActions: actions },
},  
];

export default class ParentChildRelationship extends LightningElement {
    @track fieldItem1;
    @track fieldItem2;
    @track actions = actions;
    @track columns = columns;
    @track error;
    @track data;
    @track record = [];
    @track currentRecordId;
    @track isEditForm = false;
    @track showLoadingSpinner = false;
    @track selectRecord;
    @track openmodel = false;

    selectedRecords = [];
    refreshTable;
    error;

    constructor() {
        super();
        this.selectRecord = {};
    }

    @wire(getAllInventory)
    inventoryes(result) {
        this.refreshTable = result;
        if (result.data) {
            this.data = result.data;
            this.error = undefined;
            window.console.log(this.data);
        } else if (result.error) {
            this.error = result.error;
            this.data = undefined;
        }
    }

    handleRowActions(event) {
        window.console.log('handleRowActions');
        if (event.detail.row && event.detail.action.name) {
            window.console.log('event.detail.row', event.detail.row, 'event.detail.action.name', event.detail.action.name);
            switch (event.detail.action.name) {
                case 'delete':
                    this.deleteInventory(event.detail.row);
                    break;
                default:
                    /*edit*/
                    this.editCurrentRecord(event.detail.row);  
            }
        }
    }

    editCurrentRecord(currentRow) {
        window.console.log('editCurrentRecord');

        this.openmodel = true;
        this.isEditForm = true;

        this.currentRecordId = currentRow.Id;
        this.selectRecord = currentRow;
        window.console.log('selectRecord', this.selectRecord);
        
    }

    selectValueCombobox(value) {
        getFields({ objectName: value })
            .then(result => {
                this.dataArray = result;
                let tempArray = [];
                this.dataArray.forEach(function (element) {
                    var option =
                    {
                        label:element.Label,
                        value:element.Name
                    };
                    tempArray.push(option);
                });
                this.fields = tempArray;
            })
            .catch(error => {
                this.error = error;
            });
    }

    // handleing record edit form submit
    handleSubmit(event) {
        // prevending default type sumbit of record edit form
        event.preventDefault();

        // querying the record edit form and submiting fields to form
        this.template.querySelector('lightning-record-edit-form').submit(event.detail.fields);

        // closing modal
        this.openmodel = false;

        // showing success message
        this.dispatchEvent(new ShowToastEvent({
            title: 'Success!!',
            message: event.detail.fields.FirstName + ' '+ event.detail.fields.LastName +' Contact updated Successfully!!.',
            variant: 'success'
        }),);

    }
  
    openmodal() {
        this.openmodel = true
        this.selectRecord = {};
    }

    closeModal() {
        this.openmodel = false
        this.selectRecord = {};

        return refreshApex(this.refreshTable);
    } 

    saveMethod() {
        this.closeModal();
    }
  
    handleSuccess(event) {
        const evt = new ShowToastEvent({
            title: "Inventory created",
            message: "Record ID: " + event.detail.id,
            variant: "success"
        });

        this.dispatchEvent(evt);
        this.closeModal();

        return refreshApex(this.refreshTable);
    }

  handleLoad() {
    insertParentChildRel()
    .then(result => {
      window.console.log(result);
    if (result) {
        const evt = new ShowToastEvent({
            title: 'Record Update',
            message: 'Parent-Child-Relationship table was refreshed successfully',
            variant: 'success',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
    } else { 
        const evt = new ShowToastEvent({
            title: 'Application Warning',
            message: 'Parent-Child-Relationship table was refreshed unsuccessfully',
            variant: 'error',
            mode: 'dismissable'
        });
    this.dispatchEvent(evt);
    }
  }) 
  }

  @track objects = [];
  @track fields = [];
  @wire(getObjects)
  wiredMethod({ error, data }) {
      if (data) {
          this.dataArray = data;
          let tempArray = [];
          this.dataArray.forEach(function (element) {
              var option=
              {
                  label:element,
                  value:element
              };
              tempArray.push(option);
          });
          this.objects=tempArray;
      } else if (error) {
          this.error = error;
      }
  } 
  
  handleObjectChange(event) {   
      const selectedOption = event.detail.value;
      this.fieldItem1 = selectedOption;  
      this.selectValueCombobox(selectedOption);
      
  }
  handleFieldChange(event) {
    const selectedOption = event.detail.value;
    this.fieldItem2 = selectedOption;
    window.console.log(selectedOption);
  }

  deleteInventory(currentRow) {
    let currentRecord = [];
    currentRecord.push(currentRow.Id);
    this.showLoadingSpinner = true;

    // calling apex class method to delete the selected contact
    deleteInventories({listInventId: currentRecord})
    .then(result => {
        window.console.log('result ====> ' + result);
        this.showLoadingSpinner = false;

        // showing success message
        this.dispatchEvent(new ShowToastEvent({
            title: 'Success!!',
            message: currentRow.bhdata__Label__c + ' Inventory deleted.',
            variant: 'success'
        }),);

        // refreshing table data using refresh apex
         return refreshApex(this.refreshTable);

    })
    .catch(error => {
        window.console.log('Error ====> '+error);
        this.dispatchEvent(new ShowToastEvent({
            title: 'Error!!', 
            message: error.message, 
            variant: 'error'
        }),);
    });
    
}
    get buttonName() { 
        return this.isEditForm ? 'Update' : 'Save';
    }
  /*@track label = LABEL_FIELD;
  @track RecordIdentifier = RECORD_IDENTIFIER_API_NAME_FIELD;
  @track active = ACTIVE_FIELD;
  @track include = INCLUDE_IN_SOSL_FIELD;
    rec = {
        Name : this.name,
        Industry : this.industry,
        Phone : this.phone
    }

    handleNameChange(event) {
        this.rec.Name = event.target.value;
   
    }
    
    handleIndChange(event) {
        this.rec.Industry = event.target.value;
        
    }
    
    handlePhnChange(event) {
        this.rec.Phone = event.target.value;
        
    }

    handleClick() {
        createAccount({ acc : this.rec })
            .then(result => {
                this.message = result;
                this.error = undefined;
                if(this.message !== undefined) {
                    this.rec.Name = '';
                    this.rec.Industry = '';
                    this.rec.Phone = '';
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Account created',
                            variant: 'success',
                        }),
                    );
                }
            })
            .catch(error => {
                this.message = undefined;
                this.error = error;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating record',
                        message: error.body.message,
                        variant: 'error',
                    }),
                );
                console.log("error", JSON.stringify(this.error));
            });
    }*/


}
