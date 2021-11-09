import { ethers } from 'ethers';
import './App.css';
import React, { useEffect, useState } from 'react';
import wavePortal from './utils/WavePortal.json';

export default function App() {
	const [currentAccount, setCurrentAccount] = useState('');
	const [message, setMessage] = useState('');
	const [totalWaves, setTotalWaves] = useState(0);
	const [allWaves, setAllWaves] = useState([]);
	const contractAddress = '0x1a77d615E8e47A11aaD596dD21bc66b86D2a1C10';

	const checkWalletConnection = async () => {
		try {
			const { ethereum } = window;

			if (!ethereum) {
				console.log('Make sure you have metamask!');
				return;
			} else {
				console.log('We have the ethereum object', ethereum);
			}

			const accounts = await ethereum.request({ method: 'eth_accounts' });

			if (accounts.length !== 0) {
				const account = accounts[0];
				console.log('Found an authorized account:', account);
				setCurrentAccount(account);
				getAllWaves();
			} else console.log('No authorized account found');
		} catch (error) {
			console.log(error);
		}
	};

	const connectWallet = async () => {
		try {
			const { ethereum } = window;

			if (!ethereum) {
				alert('Get MetaMask!');
				return;
			}

			const accounts = await ethereum.request({
				method: 'eth_requestAccounts',
			});

			console.log('Connected', accounts[0]);
			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.log(error);
		}
	};

	const getAllWaves = async () => {
		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const wavePortalContract = new ethers.Contract(
					contractAddress,
					wavePortal.abi,
					signer
				);

				const waves = await wavePortalContract.getAllWaves();

				let wavesCleaned = [];
				waves.forEach((wave) => {
					wavesCleaned.push({
						address: wave.waver,
						timestamp: new Date(wave.timestamp * 1000),
						message: wave.message,
					});
				});

				setAllWaves(wavesCleaned);
			} else {
				console.log("Ethereum object doesn't exist!");
			}
		} catch (error) {
			console.log(error);
		}

		let wavePortalContract;

		const onNewWave = (from, timestamp, message) => {
			console.log('NewWave', from, timestamp, message);
			setAllWaves((prevState) => [
				...prevState,
				{
					address: from,
					timestamp: new Date(timestamp * 1000),
					message: message,
				},
			]);
		};

		if (window.ethereum) {
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			const signer = provider.getSigner();

			wavePortalContract = new ethers.Contract(
				contractAddress,
				wavePortal.abi,
				signer
			);
			wavePortalContract.on('NewWave', onNewWave);
		}

		return () => {
			if (wavePortalContract) {
				wavePortalContract.off('NewWave', onNewWave);
			}
		};
	};

	const wave = async () => {
		try {
			const { ethereum } = window;

			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const wavePortalContract = new ethers.Contract(
					contractAddress,
					wavePortal.abi,
					signer
				);

				let count = await wavePortalContract.getTotalWaves();
				console.log('Retrieved total wave count...', count.toNumber());

				// execute the wave and write data to our smart contract
				const waveTxn = await wavePortalContract.wave(message, {
					gasLimit: 300000,
				});
				console.log('Mining...', waveTxn.hash);

				await waveTxn.wait();
				console.log('Mined -- ', waveTxn.hash);

				count = await wavePortalContract.getTotalWaves();
				setTotalWaves(count);
				console.log('Retrieved total wave count...', count.toNumber());
			} else {
				console.log("Ethereum object doesn't exist!");
			}
		} catch (error) {
			console.log(error);
		}
	};

	const handleChange = (e) => {
		setMessage(e.target.value);
	};

	useEffect(() => {
		checkWalletConnection();
	}, [checkWalletConnection]);

	return (
		<div className='mainContainer'>
			<div className='waveCount'>
				Total waves: {totalWaves}
				<span>
					{' '}
					{!currentAccount && (
						<button className='button' onClick={connectWallet}>
							Connect wallet
						</button>
					)}{' '}
				</span>
			</div>
			<div className='dataContainer'>
				<div className='header'>👋 What up!</div>

				<div className='bio'>
					My name is Drew and I'm a big fan of art, hooping, and anime. Connect
					your Ethereum wallet and tell me why you're wavy 🌊 !
				</div>

				{currentAccount && (
					<>
						<textarea
							name=''
							id=''
							cols='30'
							rows='4'
							placeholder='Write your message here...'
							maxlength='100'
							onChange={handleChange}></textarea>
						<div>Max length: 100 characters</div>
					</>
				)}

				<button className='button' onClick={wave}>
					Wave at Me
				</button>
			</div>
			<div className='messageContainer'>
				{[...allWaves].reverse().map((wave, i) => {
					return (
						<div className='wave-messages' key={i}>
							<div>
								Message: <p>{wave.message}</p>
							</div>
							<div>
								Address: <span>{wave.address}</span>
							</div>
							<div>
								Time: <span>{wave.timestamp.toString()}</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
