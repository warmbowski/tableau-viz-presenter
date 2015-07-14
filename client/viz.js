Template.viz.onCreated(function() {
  var self = this;
  self.subscribe('myVizState', function() {
    var viz = VizStateTracker.findOne();
    Session.setDefault('vizId', viz._id);
    Session.setDefault('message', '');
    self.data = {workbookIsLoaded: false};
  });
});

Template.viz.onRendered(function() {
  var self = this;
  var placeholderDiv = document.getElementById('tableauViz');
  var url = 'http://public.tableau.com/views/PassatMileageGraphs/AllofMyTanks?:showVizHome=no';
  var options = {
    hideToolbar: true,
    hideTabs: true,
    width: '800px',
    height: '700px',
    onFirstInteractive: function() {
      workbook = viz.getWorkbook();
      activeSheet = workbook.getActiveSheet();
      self.data = {workbookIsLoaded: true};
    }
  };

  if(Session.get('device-screensize') === 'small') {
    // <640
    options.width = '100%';
    options.height = '400px';
  } else if(Session.get('device-screensize') === 'medium') {
    // <1023
    options.width = '100%';
    options.height = '700px';
  } else if(Session.get('device-screensize') === 'large') {
    // <1440
    options.width = '1000px';
    options.height = '800px';
  } else if(Session.get('device-screensize') === 'xlarge') {
    // <1919
    options.width = '1500px';
    options.height = '1000px';
  } else if(Session.get('device-screensize') === 'xxlarge') {
    // >1920
    options.width = '2000px';
    options.height = '1500px';
  } else {
    console.log('options problem');
  }

  viz = new tableau.Viz(placeholderDiv, url, options);

  viz.addEventListener(
    tableau.TableauEventName.MARKS_SELECTION,
    function(marksEvent) {
      return marksEvent.getMarksAsync().then(
        function(marks) {
          //console.log('initial: ', marks.length);
          if(marks.length === 1) {
            //console.log('final: ', marks.length);
            var pairs = marks[0].getPairs();

            var query = {
              _id: Session.get('vizId')
            };
            var action = {
              $set:{
                filterName: pairs[1].fieldName,
                filter: pairs[1].value
              }
            };
            VizStateTracker.update(query, action);
          }
        }
      );
    }
  );

  self.autorun(function() {
    var query = VizStateTracker.find();
    var handle = query.observe({

      added: function(doc) {
        Session.set('message', 'Resyncing View . . .');
        if (self.data === null || self.data.workbookIsLoaded === false) {
          Meteor.setTimeout(function() {
            if (workbook) {
              workbook.activateSheetAsync(doc.activeSheet).then(
                function(newSheet) {
                  activeSheet = newSheet;
                  var filterValueType = typeof doc.filter;
                  if (filterValueType === 'string') {
                    activeSheet.selectMarksAsync(
                      doc.filterName,
                      doc.filter,
                      tableau.FilterUpdateType.REPLACE
                    );
                  } else  if (filterValueType === 'number') {
                    activeSheet.selectMarksAsync(
                      doc.filterName,
                      {min: doc.filter, max: doc.filter},
                      tableau.FilterUpdateType.REPLACE
                    );
                  } else {
                    activeSheet.clearSelectedMarksAsync();
                  }
                  Session.set('message', 'Resync Complete');
                  Meteor.setTimeout(function() {
                    Session.set('message', '');
                  }, 5000);
                  console.log('resync complete');
                }, 
                function() {
                  Session.set('message', 'Resync Had a Problem');
                  console.log('resync error');
                }
              );
            }
          }, 10000);
        } else {
          if (workbook) {
            workbook.activateSheetAsync(doc.activeSheet).then(
              function(newSheet) {
                activeSheet = newSheet;
                var filterValueType = typeof doc.filter;
                if (filterValueType === 'string') {
                  activeSheet.selectMarksAsync(
                    doc.filterName,
                    doc.filter,
                    tableau.FilterUpdateType.REPLACE
                  );
                } else  if (filterValueType === 'number') {
                  activeSheet.selectMarksAsync(
                    doc.filterName,
                    {min: doc.filter, max: doc.filter},
                    tableau.FilterUpdateType.REPLACE
                  );
                } else {
                  activeSheet.clearSelectedMarksAsync();
                }
                Session.set('message', 'Resync Complete');
                Meteor.setTimeout(function() {
                  Session.set('message', '');
                }, 5000);
                console.log('resync complete');
              }, 
              function() {
                Session.set('message', 'Resync Had a Problem');
                console.log('resync error');
              }
            );
          }
        }
      },

      changed: function(newDoc, oldDoc) {
        if (newDoc.activeSheet !== oldDoc.activeSheet) {
          workbook.activateSheetAsync(newDoc.activeSheet).then(
            function(newSheet) {
              activeSheet = newSheet;
            },
            function() {
              console.log('sheet not loading');
            }
          );
        }
        if (newDoc.filter !== oldDoc.filter) {
          var filterValueType = typeof newDoc.filter;
          if (filterValueType === 'string') {
            activeSheet.selectMarksAsync(
              newDoc.filterName,
              newDoc.filter,
              tableau.FilterUpdateType.REPLACE
            );
          } else if (filterValueType === 'number') {
            activeSheet.selectMarksAsync(
              newDoc.filterName,
              {min: newDoc.filter, max: newDoc.filter},
              tableau.FilterUpdateType.REPLACE
            );
          } else {
            activeSheet.clearSelectedMarksAsync();
          }
        }
      }

    });
  });
});

Template.viz.helpers({
  message: function() {
    var messageObj = {};
    if (Session.get('message')) {
      messageObj.text = Session.get('message');
      messageObj.type = 'warn';
    } else {
      messageObj.text = Session.get('message');
      messageObj.type = 'hide';
    }
    return messageObj;
  }
});

Template.viz.events({

  'click li#all-tanks': function() {
    var query = {
        _id: Session.get('vizId')
      };
    var action = {
        $set:{
          activeSheet: 'All of My Tanks',
          filter: null
        }
      };
    VizStateTracker.update(query, action);
  },

  'click li#compare-to-estimates': function() {
    var query = {
        _id: Session.get('vizId')
      };
    var action = {
        $set:{
          activeSheet: 'How My Mileage Compares to the Estimates',
          filter: null
        }
      };
    VizStateTracker.update(query, action);
  },

  'click li#typical-speeds': function() {
    var query = {
        _id: Session.get('vizId')
      };
    var action = {
        $set:{
          activeSheet: 'What Speeds do I Typically Drive?',
          filter: null
        }
      };
    VizStateTracker.update(query, action);
  },

  'click ul#fuel-type li': function(evt) {
    var filter = evt.target.textContent;
    var query = {
      _id: Session.get('vizId')
    };
    var action = {
      $set:{
        filterName: 'Fuel Type',
        filter: filter
      }
    };
    VizStateTracker.update(query, action);
  }

});
