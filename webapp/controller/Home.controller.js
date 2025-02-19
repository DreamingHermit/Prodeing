sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History"
], function(BaseController, MessageBox, Utilities, History) {
	"use strict";

	return BaseController.extend("com.sap.build.standard.prodeing.controller.Home", {
		handleRouteMatched: function(oEvent) {
			var sAppId = "App66303c034bb5bea343f95773";

			var oParams = {};

			if (oEvent.mParameters.data.context) {
				this.sContext = oEvent.mParameters.data.context;

			} else {
				if (this.getOwnerComponent().getComponentData()) {
					var patternConvert = function(oParam) {
						if (Object.keys(oParam).length !== 0) {
							for (var prop in oParam) {
								if (prop !== "sourcePrototype" && prop.includes("Set")) {
									return prop + "(" + oParam[prop][0] + ")";
								}
							}
						}
					};

					this.sContext = patternConvert(this.getOwnerComponent().getComponentData().startupParameters);

				}
			}

			var oPath;

			if (this.sContext) {
				oPath = {
					path: "/" + this.sContext,
					parameters: oParams
				};
				this.getView().bindObject(oPath);
			}

		},
		_onFioriListReportTableItemPress: function(oEvent) {

			var oBindingContext = oEvent.getParameter("listItem").getBindingContext();

			return new Promise(function(fnResolve) {
				this.doNavigate("ItemDetail", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		doNavigate: function(sRouteName, oBindingContext, fnPromiseResolve, sViaRelation) {
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oModel = (oBindingContext) ? oBindingContext.getModel() : null;

			var sEntityNameSet;
			if (sPath !== null && sPath !== "") {
				if (sPath.substring(0, 1) === "/") {
					sPath = sPath.substring(1);
				}
				sEntityNameSet = sPath.split("(")[0];
			}
			var sNavigationPropertyName;
			var sMasterContext = this.sMasterContext ? this.sMasterContext : sPath;

			if (sEntityNameSet !== null) {
				sNavigationPropertyName = sViaRelation || this.getOwnerComponent().getNavigationPropertyForNavigationWithContext(sEntityNameSet, sRouteName);
			}
			if (sNavigationPropertyName !== null && sNavigationPropertyName !== undefined) {
				if (sNavigationPropertyName === "") {
					this.oRouter.navTo(sRouteName, {
						context: sPath,
						masterContext: sMasterContext
					}, false);
				} else {
					oModel.createBindingContext(sNavigationPropertyName, oBindingContext, null, function(bindingContext) {
						if (bindingContext) {
							sPath = bindingContext.getPath();
							if (sPath.substring(0, 1) === "/") {
								sPath = sPath.substring(1);
							}
						} else {
							sPath = "undefined";
						}

						// If the navigation is a 1-n, sPath would be "undefined" as this is not supported in Build
						if (sPath === "undefined") {
							this.oRouter.navTo(sRouteName);
						} else {
							this.oRouter.navTo(sRouteName, {
								context: sPath,
								masterContext: sMasterContext
							}, false);
						}
					}.bind(this));
				}
			} else {
				this.oRouter.navTo(sRouteName);
			}

			if (typeof fnPromiseResolve === "function") {
				fnPromiseResolve();
			}

		},
		_onFioriListReportTableUpdateFinished: function(oEvent) {
			var oTable = oEvent.getSource();
			var oHeaderbar = oTable.getAggregation("headerToolbar");
			if (oHeaderbar && oHeaderbar.getAggregation("content")[1]) {
				var oTitle = oHeaderbar.getAggregation("content")[1];
				if (oTable.getBinding("items") && oTable.getBinding("items").isLengthFinal()) {
					oTitle.setText("(" + oTable.getBinding("items").getLength() + ")");
				} else {
					oTitle.setText("(1)");
				}
			}

		},
		_onFioriListReportActionButtonPress: function(oEvent) {

			var oTable = oEvent.getSource().getParent().getParent();
			return new Promise(function(fnResolve, fnReject) {
				if (oTable instanceof sap.m.Table) {
					var aItems = oTable.getSelectedItems();
					var aPromises = [];
					var oModel = oTable.getModel();
					aItems.forEach(function(oItem) {
						aPromises.push(new Promise(function(fnResolve1, fnReject1) {
							oModel.remove(oItem.getBindingContext().getPath(), {
								success: fnResolve1,
								error: fnReject1
							});
						}));
					});
					return Promise.all(aPromises).then(function() {
						oModel.refresh();
						fnResolve();
					});
				} else {
					fnReject(new Error("can't find selected items on provided collection"));
				}
			}).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onFioriListReportActionButtonPress1: function() {
			var oView = this.getView(),
				status = true,
				requiredFieldInfo = [];
			if (requiredFieldInfo.length) {
				status = this.handleChangeValuestate(requiredFieldInfo, oView);
			}
			if (status) {

				return new Promise(function(fnResolve, fnReject) {
					var bHasPendingChanges = false;
					var oModel;

					oModel = this.getView().getModel();
					bHasPendingChanges = oModel && oModel.hasPendingChanges();

					if (bHasPendingChanges) {
						var sUserMessage = "Please save your changes, first";
						fnReject(new Error(sUserMessage));
					} else {
						var oNewEntityInstance = Utilities.getDefaultValuesForNewItem();

						oModel = this.getView().getModel();
						var oNewBindingContext = oModel.createEntry("SupplySet", {
							properties: oNewEntityInstance
						});

						this.doNavigate("NewItem", oNewBindingContext, fnResolve);
					}
				}.bind(this)).catch(function(err) {
					if (err !== undefined) {
						MessageBox.error(err.message);
					}
				});
			}

		},
		handleChangeValuestate: function(requiredFieldInfo, oView) {
			var status = true;
			if (requiredFieldInfo) {
				requiredFieldInfo.forEach(function(requiredinfo) {
					var input = oView.byId(requiredinfo.id);
					if (input) {
						input.setValueState("None"); //initially set ValueState to None
						if (input.getValue() === '') {
							input.setValueState("Error"); //input is blank set ValueState to error
							status = false;
						} else if (input.getDateValue && !input._bValid) { //since 1.64 ui5 will be providing a function 'isValidValue' that can be used here.
							input.setValueState("Error"); //Invalid Date set ValueState to error
							status = false;
						}
					}
				});
			}
			return status;

		},
		_onFioriListReportActionButtonPress2: function() {
			var oView = this.getView(),
				status = true,
				requiredFieldInfo = [];
			if (requiredFieldInfo.length) {
				status = this.handleChangeValuestate(requiredFieldInfo, oView);
			}
			if (status) {

				return new Promise(function(fnResolve, fnReject) {
					var bHasPendingChanges = false;
					var oModel;

					oModel = this.getView().getModel();
					bHasPendingChanges = oModel && oModel.hasPendingChanges();

					if (bHasPendingChanges) {
						var sUserMessage = "Please save your changes, first";
						fnReject(new Error(sUserMessage));
					} else {
						var oNewEntityInstance = Utilities.getDefaultValuesForNewSupplier();

						oModel = this.getView().getModel();
						var oNewBindingContext = oModel.createEntry("SupplierSet", {
							properties: oNewEntityInstance
						});

						this.doNavigate("NewSupplier", oNewBindingContext, fnResolve);
					}
				}.bind(this)).catch(function(err) {
					if (err !== undefined) {
						MessageBox.error(err.message);
					}
				});
			}

		},
		_onFioriListReportActionButtonPress3: function() {
			var oView = this.getView(),
				status = true,
				requiredFieldInfo = [];
			if (requiredFieldInfo.length) {
				status = this.handleChangeValuestate(requiredFieldInfo, oView);
			}
			if (status) {

				return new Promise(function(fnResolve, fnReject) {
					var bHasPendingChanges = false;
					var oModel;

					oModel = this.getView().getModel();
					bHasPendingChanges = oModel && oModel.hasPendingChanges();

					if (bHasPendingChanges) {
						var sUserMessage = "Please save your changes, first";
						fnReject(new Error(sUserMessage));
					} else {
						var oNewEntityInstance = Utilities.getDefaultValuesForNewShipment();

						oModel = this.getView().getModel();
						var oNewBindingContext = oModel.createEntry("ShipmentSet", {
							properties: oNewEntityInstance
						});

						this.doNavigate("NewShipment", oNewBindingContext, fnResolve);
					}
				}.bind(this)).catch(function(err) {
					if (err !== undefined) {
						MessageBox.error(err.message);
					}
				});
			}

		},
		onInit: function() {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("Home").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
			this.oFilterBar = null;
			this.oFilterBar = this.getView().byId("ListReportFilterBar");
			var oBasicSearch = new sap.m.SearchField({
				showSearchButton: true
			});
			this.oFilterBar.setBasicSearch(oBasicSearch);

		},
		onExit: function() {

			// to destroy templates for bound aggregations when templateShareable is true on exit to prevent duplicateId issue
			var aControls = [{
				"controlId": "Fiori_ListReport_ListReport_0-filterBars-Fiori_ListReport_FilterBar-1-filters-Fiori_ListReport_ComboBoxFilter-1715643179424---1",
				"groups": ["items"]
			}, {
				"controlId": "Fiori_ListReport_ListReport_0-content-Fiori_ListReport_Table-1",
				"groups": ["items"]
			}];
			for (var i = 0; i < aControls.length; i++) {
				var oControl = this.getView().byId(aControls[i].controlId);
				if (oControl) {
					for (var j = 0; j < aControls[i].groups.length; j++) {
						var sAggregationName = aControls[i].groups[j];
						var oBindingInfo = oControl.getBindingInfo(sAggregationName);
						if (oBindingInfo) {
							var oTemplate = oBindingInfo.template;
							oTemplate.destroy();
						}
					}
				}
			}

		}
	});
}, /* bExport= */ true);
