define((require) => {
  const Val             = require('koru/model/validation');
  const util            = require('koru/util');
  const Category        = require('models/category');
  const TeamType        = require('models/team-type');

  return (Event) => {
    util.merge(Event.prototype, {
      get sortedTeamTypes() {
        const list = this.$cache.sortedTeamTypes;
        return list || (
          this.$cache.sortedTeamTypes = this.teamType_ids.map((id) => TeamType.findById(id))
            .sort(util.compareByName));
      },

      validate() {
        const heats = this.changes.heats;
        if (heats != null) for (const id in heats) {
          const cat = Category.findById(id);
          Val.allowAccessIf(cat.org_id === this.org_id);
          const format = heats[id];
          if (format[0] !== cat.type || ! cat.heatFormatRegex.test(format.slice(1))) {
            return Val.addError(this, 'heats', 'is_invalid');
          }
        }
      },
    });
  };
});
