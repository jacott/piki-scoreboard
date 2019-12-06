define(()=> mig =>{
  mig.createTable({
    name: 'ClimberRanking',
    fields: {
      climber_id: {type: "belongs_to"},
      event_id: {type: "belongs_to"},
      category_id: {type: "belongs_to"},
      rank: {type: "integer"},
      points: {type: "integer"},
      type: {type: 'char'},
    },
    primaryKey: false,

    indexes: [{columns: ['event_id', 'category_id', 'climber_id'], unique: true}]
  });
});
