Meteor.publish('myVizState', function() {
  return VizStateTracker.find({},{limit: 1});
});