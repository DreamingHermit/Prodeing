sap.ui.define([
	"./utilities"
], function() {
	"use strict";

	// class providing static utility methods to retrieve entity default values.

	return {
		getDefaultValuesForNewItem: function() {
			return {
				"ID": "id-" + Date.now().toString(),
				"Name": "",
				"Category": "",
				"Amount": 0,
				"___FK_8e4000c6a6273f811b0553fe_00017": "",
				"SupplyImage": "",
				"Location": "",
				"AmountType": ""
			};
		},
		getDefaultValuesForNewSupplier: function() {
			return {
				"ID": "id-" + Date.now().toString(),
				"Name": "",
				"Phone": "",
				"Address": ""
			};
		},
		getDefaultValuesForNewShipment: function() {
			return {
				"ID": "id-" + Date.now().toString(),
				"___FK_ec0167b43cf54a931b111b70_00003": "",
				"___FK_ec0167b43cf54a931b111b70_00005": "",
				"Date": "",
				"UnitPrice": 0,
				"Quantity": 0,
				"___FK_0568e6b46c2f810c1b112290_00003": "",
				"___FK_0568e6b46c2f810c1b112290_00007": ""
			};
		}
	};
});
