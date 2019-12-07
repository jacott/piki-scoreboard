create view "TeamRanking"
  as select cp.team_id, cr.event_id, cr.category_id, sum(cr.points) as points, cr.type
       from "ClimberRanking" as cr, (select climber_id, event_id, unnest(team_ids) as team_id from "Competitor") as cp
      where cp.climber_id = cr.climber_id and cp.event_id = cr.event_id
      group by cr.event_id, category_id, cr.type, team_id;
