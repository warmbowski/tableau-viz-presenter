Meteor.startup(function () {
  if (VizStateTracker.find().count() === 0) {
    var state = {
      defaultSheet: 'All of My Tanks',
      activeSheet: '',
      filterName: null,
      filter: null
    };
    var newViz = VizStateTracker.insert(state);
  }
});
