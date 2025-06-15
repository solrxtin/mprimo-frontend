import { BlockchainListenerService } from './blockchain-listener.service';
import { SocketService } from './socket.service';

let blockchainListenerService: BlockchainListenerService;

export function initializeBlockchainListener(socketService: SocketService): void {
  const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/your-infura-key';
  blockchainListenerService = new BlockchainListenerService(socketService, rpcUrl);
  blockchainListenerService.startListening();
  console.log('Blockchain listener service started');
}

export function getBlockchainListenerService(): BlockchainListenerService {
  return blockchainListenerService;
}