// Interface for the foreign contract
interface IFriendTechV1 {
    function sellShares(address sharesSubject, uint256 amount) external payable;
    function buyShares(address sharesSubject, uint256 amount) external payable;
}
