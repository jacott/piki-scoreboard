define((require)=>{
  const Category        = require('models/category');
  const Climber         = require('models/climber');
  const Event           = require('models/event');
  const Series          = require('models/series');
  const Team            = require('models/team');
  const TeamType        = require('models/team-type');

  return [Category, Climber, Event, Series, Team, TeamType];
});
