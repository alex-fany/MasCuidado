import { test } from 'node:test';
import assert from 'node:assert/strict';
import { screenTutorial } from './tutorialState.js';
import { introductorySteps, windowMessages, viewMessages, detailedSteps } from './tutorialContent.js';

test('las herramientas de mascota solo se presentan después de desbloquearlas', () => {
  assert.equal(screenTutorial('home', false), 'welcome');
  assert.equal(screenTutorial('home', true), 'home');
  for (const view of ['map', 'calendar']) {
    assert.equal(screenTutorial(view, false), null);
    assert.equal(screenTutorial(view, true), view);
  }
  assert.equal(screenTutorial('profile', false), 'profile');
  assert.equal(screenTutorial('inexistente', true), null);
});

test('los recorridos detallados tienen anclas explícitas y textos completos', () => {
  for (const definitions of Object.values(detailedSteps)) for (const step of definitions) {
    assert.ok(/^[a-z-]+$/.test(step.anchor));
    assert.equal(step.message.length, 6);
    assert.ok(step.message.every(text => typeof text === 'string' && text.trim()));
    if (step.mobile) {
      assert.equal(step.mobile.length, 3);
      assert.ok(step.mobile.every(text => typeof text === 'string' && text.trim()));
    }
  }
  assert.deepEqual(detailedSteps.logros.map(step => step.anchor), ['achievements-progress', 'achievements-list']);
  assert.equal(detailedSteps.add[0].anchor, 'register-pet');
  assert.equal(detailedSteps.edit[0].anchor, 'save-pet');
  assert.equal(detailedSteps.settings[0].anchor, 'settings-panel');
  assert.equal(detailedSteps.theme[0].anchor, 'theme-options');
  assert.equal(detailedSteps.language[0].anchor, 'language-options');
  assert.ok(detailedSteps.record.find(step => step.anchor === 'record-photos').optional);
  assert.equal(detailedSteps.profile.filter(step => step.mobile).length, 3);
  assert.equal(detailedSteps.calendar.filter(step => step.mobile).length, 2);
});
test('todos los pasos incluyen título y descripción en los tres idiomas', () => {
  const messages = [...Object.values(windowMessages), ...Object.values(viewMessages),
    ...Object.values(introductorySteps).flat().map(([, ...message]) => message)];
  for (const message of messages) {
    assert.equal(message.length, 6);
    assert.ok(message.every(text => typeof text === 'string' && text.trim().length > 0));
  }
});
