import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import {
  assertFails,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-sumaiya-site',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
    storage: { rules: readFileSync('storage.rules', 'utf8') },
  });
});

after(async () => {
  await env.cleanup();
});

const clients = {
  'an anonymous visitor': () => env.unauthenticatedContext(),
  'a signed-in user': () => env.authenticatedContext('some-user'),
};

for (const [who, context] of Object.entries(clients)) {
  test(`${who} cannot read or write Firestore`, async () => {
    const doc = context().firestore().doc('anything/here');
    await assertFails(doc.get());
    await assertFails(doc.set({ value: 1 }));
  });

  test(`${who} cannot read or write Storage`, async () => {
    const file = context().storage().ref('anything/here.txt');
    await assertFails(file.getMetadata());
    await assertFails(file.put(new Uint8Array([1])));
  });
}
