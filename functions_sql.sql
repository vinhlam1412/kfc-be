CREATE OR REPLACE FUNCTION upsert_score(
  p_game_id INTEGER,
  p_player_id INTEGER,
  p_event_id INTEGER,
  p_score FLOAT,
  p_new_score FLOAT
)
RETURNS VOID AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM scores AS s WHERE s.player_id = p_player_id AND s.game_id = p_game_id AND s.event_id = p_event_id) THEN
    UPDATE scores
    SET score = p_score, updated_at = NOW()
    WHERE player_id = p_player_id AND game_id = p_game_id AND event_id = p_event_id;
  ELSE
    INSERT INTO scores (game_id, player_id, event_id, score)
    VALUES (p_game_id, p_player_id, p_event_id, p_score);
  END IF;

  INSERT INTO game_play_history (game_id, player_id, score, event_id)
  VALUES (p_game_id, p_player_id, p_new_score, p_event_id);
END;
$$ LANGUAGE plpgsql;

CREATE
OR REPLACE FUNCTION create_history_reward (
  p_type TEXT,
  p_is_give BOOLEAN,
  p_voucher_id INTEGER,
  p_reward_id INTEGER,
  p_player_id INTEGER,
  p_event_id INTEGER,
  p_ticket_id INTEGER,
  p_area TEXT,
  p_item_quantity INTEGER,
  p_number_of_times_spin INTEGER
) RETURNS VOID AS $$
BEGIN
  IF p_type = 'item' THEN
    PERFORM 1 FROM rewards WHERE id = p_reward_id FOR UPDATE;
    UPDATE rewards
    SET quantity = p_item_quantity
    WHERE id = p_reward_id;
  END IF;

  IF p_type = 'voucher' THEN
    PERFORM 1 FROM vouchers WHERE id = p_voucher_id FOR UPDATE;
    UPDATE vouchers
    SET is_give = p_is_give
    WHERE id = p_voucher_id;
  END IF;

  IF p_type = 'ticket' THEN
    PERFORM 1 FROM tickets WHERE id = p_ticket_id FOR UPDATE;
    UPDATE tickets
    SET is_gift = true
    WHERE id = p_ticket_id;
  END IF;

  INSERT INTO history_rewards (type, voucher_id, player_id, event_id, gift_at, area, reward_id, ticket_id)
  VALUES (p_type, CASE WHEN p_voucher_id IS NULL THEN NULL ELSE p_voucher_id END, p_player_id, p_event_id, NOW(), p_area, CASE WHEN p_reward_id IS NULL THEN NULL ELSE p_reward_id END, CASE WHEN p_ticket_id IS NULL THEN NULL ELSE p_ticket_id END);

  UPDATE players
  SET number_of_times_spin = p_number_of_times_spin
  WHERE id = p_player_id;
END;
$$ LANGUAGE plpgsql;




CREATE
OR REPLACE FUNCTION play (
  p_number_of_plays INTEGER,
  p_number_of_times_spin INTEGER,
  p_bill_id INTEGER,
  p_player_id INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE bills
  SET number_of_plays = p_number_of_plays,updated_at = NOW()
  WHERE id = p_bill_id;

  UPDATE players
  SET number_of_times_spin = p_number_of_times_spin
  WHERE id = p_player_id;
END;
$$ LANGUAGE plpgsql;


CREATE
OR REPLACE FUNCTION update_number_spin_of_player (
  p_number_of_times_spin INTEGER,
  p_player_id INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE players
  SET number_of_times_spin = p_number_of_times_spin
  WHERE id = p_player_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_player_count_per_game(start_date TIMESTAMP, end_date TIMESTAMP)
RETURNS TABLE(game_id integer, player_count integer)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT s.game_id::integer, COUNT(s.player_id)::integer AS player_count
  FROM scores s
  WHERE s.created_at >= start_date AND s.created_at <= end_date
  GROUP BY s.game_id;
END;
$$;


CREATE OR REPLACE FUNCTION create_bills(
  p_invoice TEXT,
  p_store_id INTEGER,
  p_game_id INTEGER,
  p_player_id INTEGER,
  p_event_id INTEGER,
  p_combos JSONB[],
  p_number_of_plays INTEGER,
  p_order_note TEXT,
  p_area TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO bills (invoice, store_id, game_id, player_id, event_id, combos, number_of_plays, order_note)
  VALUES (
    CASE WHEN p_invoice IS NULL THEN NULL ELSE p_invoice END,
    p_store_id,
    p_game_id,
    p_player_id,
    p_event_id,
    p_combos,
    p_number_of_plays,
    CASE WHEN p_order_note IS NULL THEN NULL ELSE p_order_note END
  );

  INSERT INTO logs_scan_bill(invoice,player_id,event_id,order_note,store_id,game_id)
  VALUES(
    CASE WHEN p_invoice IS NULL THEN NULL ELSE p_invoice END,
    p_player_id,
    p_event_id,
    CASE WHEN p_order_note IS NULL THEN NULL ELSE p_order_note END,
    p_store_id,
    p_game_id
  );

  IF NOT EXISTS (SELECT 1 FROM logs as l WHERE l.player_id = p_player_id AND l.game_id = p_game_id AND l.event_id = p_event_id) THEN 
    INSERT INTO logs (player_id, game_id, event_id,total_scan,area)
    VALUES (
      p_player_id,
      p_game_id,
      p_event_id,
      1,
      p_area
    );
  ELSE
    UPDATE logs
    SET total_scan = subquery.total_scan + 1, area = p_area
    FROM (SELECT total_scan FROM logs as l WHERE l.player_id = p_player_id AND l.game_id = p_game_id AND l.event_id = p_event_id) AS subquery
    WHERE player_id = p_player_id AND game_id = p_game_id AND event_id = p_event_id;
  END IF;
END;
$$ LANGUAGE plpgsql;






CREATE OR REPLACE FUNCTION update_bills(
  p_player_id INTEGER,
  p_game_id INTEGER,
  p_event_id INTEGER,
  p_bill_id INTEGER,
  p_area TEXT,
  p_invoice TEXT,
  p_order_note TEXT,
  p_store_id INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE bills
  SET player_id = p_player_id, game_id = p_game_id
  WHERE id = p_bill_id;

  INSERT INTO logs_scan_bill(invoice,player_id,event_id,order_note,store_id,game_id)
  VALUES(
    CASE WHEN p_invoice IS NULL THEN NULL ELSE p_invoice END,
    p_player_id,
    p_event_id,
    CASE WHEN p_order_note IS NULL THEN NULL ELSE p_order_note END,
    p_store_id,
    p_game_id
  );

  IF NOT EXISTS (SELECT 1 FROM logs as l WHERE l.player_id = p_player_id AND l.game_id = p_game_id AND l.event_id = p_event_id) THEN 
    INSERT INTO logs (player_id, game_id, event_id,total_scan,area)
    VALUES (
      p_player_id,
      p_game_id,
      p_event_id,
      1,
      p_area
    );
  ELSE
    UPDATE logs
    SET total_scan = subquery.total_scan + 1, area = p_area
    FROM (SELECT total_scan FROM logs as l WHERE l.player_id = p_player_id AND l.game_id = p_game_id AND l.event_id = p_event_id) AS subquery
    WHERE player_id = p_player_id AND game_id = p_game_id AND event_id = p_event_id;
  END IF;
END;
$$ LANGUAGE plpgsql;



