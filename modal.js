import { LightningElement, api, wire, track } from 'lwc';
import getObjectApiNames from '@salesforce/apex/ParentChildRelationCtrl.getObjects';
import getRecordIdentifierApiNames from '@salesforce/apex/ParentChildRelationCtrl.getFields';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ModalParentChildRelationship extends LightningElement {
    @api selectedData;
    @track recordData;
    @track objectApiNames;
    @track recordIdentifierApiNames;


    constructor() {
        super();
        this.objectApiNames = [];
        this.recordIdentifierApiNames = [];
        this.recordData = {
            'bhdata__Active__c' : true,
            'bhdata__RecordIdentifierApiName__c' : ' '
        };
    }

    connectedCallback() {
        window.console.log('connectedCallback');
        if (this.selectedData) {
            this.recordData = Object.assign({}, this.selectedData);
            if (this.recordData.bhdata__ObjectApiName__c) {
                this.recordData.bhdata__ObjectApiName__c = this.recordData.bhdata__ObjectApiName__c.toLowerCase();
            }

            this.getRecordIdentifierApiNamesByValue(this.recordData.bhdata__ObjectApiName__c);

            if (this.recordData.bhdata__RecordIdentifierApiName__c) {
                this.recordData.bhdata__RecordIdentifierApiName__c = this.recordData.bhdata__RecordIdentifierApiName__c.toLowerCase();
            }
        } 
        if (!this.recordData.Id) {
            this.recordData.bhdata__Active__c = true;
            this.recordData.bhdata__RecordIdentifierApiName__c = '';   
        }

        window.console.log(this.selectedData, this.recordData);
    }

    get submitName() { 
        return this.recordData.Id ? 'Update' : 'Save';
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleSuccess(event) {
        this.showMessage('Inventory created', 'Record ID: ' + event.detail.id, 'success');
        this.handleClose();
    }

    handleChangeObjectApiName(event) { 
        window.console.log('handleChangeObjectApiName');
        this.recordData.bhdata__ObjectApiName__c = event.detail.value;
        this.recordData.bhdata__Label__c = event.target.options.find(opt => opt.value === event.detail.value).label;
        this.recordData.bhdata__RecordIdentifierApiName__c = '';
        this.getRecordIdentifierApiNamesByValue(this.recordData.bhdata__ObjectApiName__c);
    }

    handleChangeRecordIdentifierApiNames(event) {
        this.recordData.bhdata__RecordIdentifierApiName__c = event.detail.value;
    }

    showMessage(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        }));
    }

    @wire(getObjectApiNames) 
    wiredObjectApiNames({ error, data }) {
        if (data) {
            this.objectApiNames = data.map(el => {
                return {
                    label: el.Label,
                    value: el.Name.toLowerCase()
                }
            });
        } else if (error) {
            window.console.log('wiredObjectApiNames error', error);
        }
    } 

    getRecordIdentifierApiNamesByValue(value) {
        if (value) {
            getRecordIdentifierApiNames({ objectName: value })
                .then(data => {
                    if (data) {
                        this.recordIdentifierApiNames = data.map(el => {
                            return {
                                label: el.Label,
                                value: el.Name.toLowerCase()
                            }
                        });
                    }
                })
                .catch(error => {
                    window.console.log('wiredObjectApiNames error', error);
                });
        } else {
            this.recordIdentifierApiNames = [];
        }
    }
}
