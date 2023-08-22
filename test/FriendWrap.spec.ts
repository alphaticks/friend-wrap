import {ethers, waffle} from 'hardhat'
import {Wallet} from 'ethers'
import {FriendWrap, FriendtechSharesV1} from '../typechain-types'
import {expect} from './shared/expect'

const createFixtureLoader = waffle.createFixtureLoader

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T

describe('FriendWrap', () => {
    let wallet: Wallet, other: Wallet
    let ftFactory: any
    let fwFactory: any
    let friendTech: FriendtechSharesV1
    let friendWrap: FriendWrap
    before('create fixture loader', async () => {
        [wallet, other] = await (ethers as any).getSigners()
        ftFactory = await ethers.getContractFactory('FriendtechSharesV1')
        fwFactory = await ethers.getContractFactory('FriendWrap')
    })

    beforeEach('deploy fixture', async () => {
        friendTech = await ftFactory.deploy() as FriendtechSharesV1
        friendWrap = await fwFactory.deploy(wallet.address, friendTech.address) as FriendWrap
    })

    describe('mint', () => {
        it('tries to mint without enough eth', async () => {
            // First share subject unlocks trading
            let price = await friendTech.getBuyPrice(other.address, 1)
            await friendTech.connect(other).buyShares(other.address, 1, {
                value: price
            })
            let balance = await ethers.provider.getBalance(wallet.address)
            price = await friendTech.getBuyPrice(other.address, 1)
            await expect(friendWrap.connect(other).mintShares(other.address, 1, {
                value: price.sub(1)
            })).to.be.revertedWith("Insufficient payment")
            let balancec = await ethers.provider.getBalance(wallet.address)
            expect(balance).to.eq(balancec)
        })

        it('mints and burn one share', async () => {
            // First share subject unlocks trading
            let price = await friendTech.getBuyPrice(other.address, 1)
            await friendTech.connect(other).buyShares(other.address, 1, {
                value: price
            })
            price = await friendTech.getBuyPrice(other.address, 1)
            await friendWrap.connect(wallet).mintShares(other.address, 1, {
                value: price
            })
            let balance = await friendWrap.balanceOf(wallet.address, ethers.BigNumber.from(other.address))
            expect(balance).to.eq(1 * 10**8)
            // Transfer 1 fractional share to other
            await friendWrap.connect(wallet).safeTransferFrom(wallet.address, other.address, ethers.BigNumber.from(other.address), 1, [])
            // Try to redeem
            await expect(friendWrap.connect(other).redeemShares(other.address, 1)).to.be.revertedWith("ERC1155: burn amount exceeds balance")
            // Transfer back
            await friendWrap.connect(other).safeTransferFrom(other.address, wallet.address, ethers.BigNumber.from(other.address), 1, [])
            // Try to redeem again
            await friendWrap.connect(wallet).redeemShares(other.address, 1)
        })
    })
})
