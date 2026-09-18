import React from 'react';
import { DAY_STAGES, useGame } from '../store';
import DayNightResult from './day/DayNightResult';
import DayDiscussion from './day/DayDiscussion';
import DayVoting from './day/DayVoting';
import DayDefense from './day/DayDefense';
import DayFinalVote from './day/DayFinalVote';
import DayResults from './day/DayResults';

export default function DayFlow() {
  const { game } = useGame();
  switch (game.day?.stage) {
    case DAY_STAGES.DISCUSSION:
      return <DayDiscussion />;
    case DAY_STAGES.VOTING:
      return <DayVoting />;
    case DAY_STAGES.DEFENSE:
      return <DayDefense />;
    case DAY_STAGES.FINAL_VOTE:
      return <DayFinalVote />;
    case DAY_STAGES.RESULTS:
      return <DayResults />;
    case DAY_STAGES.NIGHT_RESULT:
    default:
      return <DayNightResult />;
  }
}
