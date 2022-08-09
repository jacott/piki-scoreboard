define((require) => {
  return (Result) => {
    Result.remote({
      complete(results) {
        for (const row of results) {
          Result.findById(row._id)._doSetSpeedScore(row);
        }
      },
    });
  };
});
