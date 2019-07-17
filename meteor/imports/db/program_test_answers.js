import { Mongo } from 'meteor/mongo';

const programTestAnswers = new Mongo.Collection('program_test_answers');

programTestAnswers.allow({
  insert() {
    return true;
  },
  update() {
    return true;
  },
  remove() {
    return true;
  },
});

export default programTestAnswers;
