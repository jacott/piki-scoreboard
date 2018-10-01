define((require, exports, module)=>{
  const Dom             = require('koru/dom');
  const Route           = require('koru/ui/route');
  const $ = Dom.current;

  const replacePage = (data, showingResults, heatNumber)=>{
    Route.replacePage(Dom.Event.Category, {
      eventId: data.event_id, append: data.category._id,
      search: `?type=${showingResults ? 'results' : 'startlists'}&heat=${heatNumber}`
    });
  };

  return {
    SPEED_FINAL_NAME: {
      R: 'Final',
      0: 'Quals',
      1: 'Final',
      2: 'Semi-final',
      3: '1/4-final',
      4: 'Round of 16',
    },

    replacePage,

    extendResultTemplate: tpl =>{
      tpl.$events({
        'change [name=selectHeat]'(event) {
          Dom.stopEvent();
          const {data} = $.ctx;
          replacePage(data, data.showingResults, this.value);
        },

        'click [name=toggleStartOrder]'(event) {
          Dom.stopEvent();
          const {data} = $.ctx;
          replacePage(data, ! data.showingResults, data.heatNumber);
        },
      });

      tpl.$helpers({
        modeSwitchLabel() {
          return this.showingResults ? "Show start list" : "Show results";
        },
        mode() {return this.showingResults ? 'Results' : 'Start list'},
      });
    },
  };
});
