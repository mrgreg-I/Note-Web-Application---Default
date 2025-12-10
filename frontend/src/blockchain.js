import { Core, Blaze, Provider, WebWallet } from '@blaze-cardano/sdk';
import fetch from 'cross-fetch';

// Helper: format content into metadata-safe chunks (<=64 bytes each).
export const formatContent = (content) => {
  const safe = content || '';
  if (safe.length <= 64) {
    return Core.Metadatum.newText(safe);
  }
  const chunks = safe.match(/.{1,64}/g) || [];
  const list = new Core.MetadatumList();
  chunks.forEach((chunk) => list.add(Core.Metadatum.newText(chunk)));
  return Core.Metadatum.newList(list);
};

// Build + sign + submit a tx with attached metadata for notes.
export const sendTransaction = async ({
  blockfrostProjectId,
  network = 'preview',
  walletApi,
  targetAddress,
  lovelaceAmount = 0n,
  noteContent,
  action,
  noteId,
}) => {
  if (!blockfrostProjectId) {
    throw new Error('Missing Blockfrost project id');
  }
  if (!walletApi) {
    throw new Error('Missing wallet API');
  }

  const provider = await Provider.fromBlockfrost(blockfrostProjectId, {
    network,
    fetch,
  });

  const wallet = new WebWallet(walletApi);
  const blaze = await Blaze.from(provider, wallet);

  // Basic payment leg (0 lovelace allowed for metadata-only simulation).
  let tx = blaze
    .newTransaction()
    .payLovelace(Core.Address.fromBech32(targetAddress), BigInt(lovelaceAmount));

  // Construct metadata.
  const metadata = new Map();
  const label = 42819n; // App-specific label
  const metadatumMap = new Core.MetadatumMap();
  metadatumMap.insert(Core.Metadatum.newText('action'), Core.Metadatum.newText(action));
  metadatumMap.insert(Core.Metadatum.newText('note'), formatContent(noteContent || ''));
  metadatumMap.insert(Core.Metadatum.newText('created_at'), Core.Metadatum.newText(new Date().toISOString()));
  if (noteId) {
    metadatumMap.insert(Core.Metadatum.newText('note_id'), Core.Metadatum.newText(String(noteId)));
  }
  const metadatum = Core.Metadatum.newMap(metadatumMap);
  metadata.set(label, metadatum);
  const finalMetadata = new Core.Metadata(metadata);
  tx.setMetadata(finalMetadata);

  const completedTx = await tx.complete();
  const signedTx = await blaze.signTransaction(completedTx);
  const txId = await blaze.provider.postTransactionToChain(signedTx);
  return txId;
};

// Poll Blockfrost for confirmation of a tx hash.
export const pollTx = async ({ blockfrostProjectId, network = 'preview', txHash }) => {
  if (!txHash || !blockfrostProjectId) return null;
  const url = `https://cardano-${network}.blockfrost.io/api/v0/txs/${txHash}`;
  const res = await fetch(url, {
    headers: {
      project_id: blockfrostProjectId,
    },
  });
  if (res.status === 200) {
    return await res.json();
  }
  if (res.status === 404) {
    return null;
  }
  throw new Error(`Blockfrost error ${res.status}`);
};

