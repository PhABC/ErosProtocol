pragma solidity ^0.4.17;

// This contract allows Matchers from being paid by providing information that allows
// user from group A to connect to user from group B. 

//last compiled with soljson-v0.3.6-2016-08-29-b8060c5.js

contract SafeMath {
    function safeMul(uint a, uint b) internal constant returns (uint256) {
        uint c = a * b;
        assert(a == 0 || c / a == b);
        return c;
    }

    function safeDiv(uint a, uint b) internal constant returns (uint256) {
        uint c = a / b;
        return c;
    }

    function safeSub(uint a, uint b) internal constant returns (uint256) {
        assert(b <= a);
        return a - b;
    }

    function safeAdd(uint a, uint b) internal constant returns (uint256) {
        uint c = a + b;
        assert(c >= a);
        return c;
    }

    function max64(uint64 a, uint64 b) internal constant returns (uint64) {
        return a >= b ? a : b;
    }

    function min64(uint64 a, uint64 b) internal constant returns (uint64) {
        return a < b ? a : b;
    }

    function max256(uint256 a, uint256 b) internal constant returns (uint256) {
        return a >= b ? a : b;
    }

    function min256(uint256 a, uint256 b) internal constant returns (uint256) {
        return a < b ? a : b;
    }
}

contract Token {

    /// @return total amount of tokens
    function totalSupply() constant returns (uint supply) {}

    /// @param _owner The address from which the balance will be retrieved
    /// @return The balance
    function balanceOf(address _owner) constant returns (uint balance) {}

    /// @notice send `_value` token to `_to` from `msg.sender`
    /// @param _to The address of the recipient
    /// @param _value The amount of token to be transferred
    /// @return Whether the transfer was successful or not
    function transfer(address _to, uint _value) returns (bool success) {}

    /// @notice send `_value` token to `_to` from `_from` on the condition it is approved by `_from`
    /// @param _from The address of the sender
    /// @param _to The address of the recipient
    /// @param _value The amount of token to be transferred
    /// @return Whether the transfer was successful or not
    function transferFrom(address _from, address _to, uint _value) returns (bool success) {}

    /// @notice `msg.sender` approves `_addr` to spend `_value` tokens
    /// @param _spender The address of the account able to transfer the tokens
    /// @param _value The amount of wei to be approved for transfer
    /// @return Whether the approval was successful or not
    function approve(address _spender, uint _value) returns (bool success) {}

    /// @param _owner The address of the account owning tokens
    /// @param _spender The address of the account able to transfer the tokens
    /// @return Amount of remaining tokens allowed to spent
    function allowance(address _owner, address _spender) constant returns (uint remaining) {}

    event Transfer(address indexed _from, address indexed _to, uint _value);
    event Approval(address indexed _owner, address indexed _spender, uint _value);
}


contract StandardToken is Token, SafeMath {

    /*
     *  Data structures
     */
    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowed;
    uint256 public totalSupply;

    /*
     *  Public functions
     */
    /// @dev Transfers sender's tokens to a given address. Returns success.
    /// @param _to Address of token receiver.
    /// @param _value Number of tokens to transfer.
    /// @return Returns success of function call.
    function transfer(address _to, uint256 _value)
        public
        returns (bool)
    {
        balances[msg.sender] = safeSub(balances[msg.sender], _value);
        balances[_to] = safeAdd(balances[_to], _value);
        Transfer(msg.sender, _to, _value);
        return true;
    }

    /// @dev Allows allowed third party to transfer tokens from one address to another. Returns success.
    /// @param _from Address from where tokens are withdrawn.
    /// @param _to Address to where tokens are sent.
    /// @param _value Number of tokens to transfer.
    /// @return Returns success of function call.
    function transferFrom(address _from, address _to, uint256 _value)
        public
        returns (bool)
    {
        balances[_from] = safeSub(balances[_from], _value);
        allowed[_from][msg.sender] = safeSub(allowed[_from][msg.sender], _value);
        balances[_to] = safeAdd(balances[_to], _value);
        Transfer(_from, _to, _value);
        return true;
    }

    /// @dev Sets approved amount of tokens for spender. Returns success.
    /// @param _spender Address of allowed account.
    /// @param _value Number of approved tokens.
    /// @return Returns success of function call.
    function approve(address _spender, uint256 _value)
        public
        returns (bool)
    {
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    /*
     * Read functions
     */
    /// @dev Returns number of allowed tokens for given address.
    /// @param _owner Address of token owner.
    /// @param _spender Address of token spender.
    /// @return Returns remaining allowance for spender.
    function allowance(address _owner, address _spender)
        constant
        public
        returns (uint256)
    {
        return allowed[_owner][_spender];
    }

    /// @dev Returns number of tokens owned by given address.
    /// @param _owner Address of token owner.
    /// @return Returns balance of owner.
    function balanceOf(address _owner)
        constant
        public
        returns (uint256)
    {
        return balances[_owner];
    }
}


contract ErosDiscoveryProtocol is SafeMath {
	
	// Bounds related events
	// event BoundwithdrawRequest(address indexed Matcher, uint256 _value);
	// event Boundwithdraw(address indexed Matcher, uint256 _value);
	// event Sentence(address indexed _from, address indexed _to, uint256 _value);

	// Bounty related events
	event BountyDeposit(address token, address indexed user, uint _value, uint balance);
	event BountyWithdrawRequest(address token, address indexed user, uint _value, uint balance);
	event BountyWithdraw(address token, address indexed user, uint _value, uint balance);
	event MatchFound(address matcher, address maker, address taker);
	event BountyClaimed(address matcher, address maker, address taker, uint bounty);

	// 0x Order
	struct Order {
        uint expirationTimestampInSec;
        bytes32 orderHash;
    }


	address public owner; //Contract owner

	// mapping (address => uint256) bounds; //Bounds for Matchers
	// mapping (address => uint256) boundsWithdrawUnlockPeriod;  //When matcher can unlock bounds funds
	// mapping (address => uint256) bonudsWithdrawApprovedValue; //When matcher can unlock bounds funds

	mapping (address => mapping (address => uint256)) public bounties; // Mapping of token addresses to mapping of account balances for
	mapping (address => uint256) bountyWithdrawUnlockPeriod;  //When user can unlock bounty funds
	mapping (address => uint256) bonutyWithdrawApprovedValue; //When user can unlock bounty funds

	mapping (address => address) orderVerificationContract; // Allow smart contract to specify their order verification protocol 
	mapping (address => address) canClaimBounty; // Will say who can claim a current stake bounty
	
	// uint32 boundsWithdrawPendingPeriod = 30 days;    //_value of time before bounds can be withdrawn
	uint32 bountyWithdrawPendingPeriod = 30 minutes; //_value of time before bounties (matching fees) can be withdrawn

	// uint8 boundPenality = 50; // Percentage of bound lost when infractiong happen

	function ErosDiscoveryProtocol() {
		owner = msg.sender;
	}

	modifier ownerOnly() {

        require(msg.sender == owner);
        _;
	
	}

	modifier bountyWithdrawAllowed() {

		require(bountyWithdrawUnlockPeriod[msg.sender] != 0x0);
		require(now > bountyWithdrawUnlockPeriod[msg.sender]);
		_;

	}

	function getOwner() public constant returns (address own){
		return owner;
	}

	//  ---------------------FEE/BOUNRTY DEPOSIT & WITHDRAWL---------------------------------

	function depositEtherBounty() public payable returns (bool success) {
	  	
	  	require(msg.value > 0);

	    bounties[0][msg.sender] = safeAdd(bounties[0][msg.sender], msg.value);
	    BountyDeposit(0, msg.sender, msg.value, bounties[0][msg.sender]);

	    return true;
	}

	function getTokenBalance(address _token) public constant returns(uint balance) {

		return Token(_token).balanceOf(msg.sender);
	}


	function depositTokenBounty(address _token, uint _value) public returns (bool success) {

		require(_value > 0);
	    require(Token(_token).transfer(this, _value));

	    bounties[_token][msg.sender] = safeAdd(bounties[_token][msg.sender], _value);
	    BountyDeposit(_token, msg.sender, _value, bounties[_token][msg.sender]);

	    return true;

	}

	// Starting the timer to allow bounty withdraw in ETH
	function bountyWithdrawRequest(address _token, uint256 _value) public returns (bool success) {

		// address of ETH is 0

		require(_value > 0);
		require(bounties[_token][msg.sender] >= _value);

		bountyWithdrawUnlockPeriod[msg.sender]  = now + bountyWithdrawPendingPeriod;
		bonutyWithdrawApprovedValue[msg.sender] = _value;

		BountyWithdrawRequest(_token, msg.sender, _value, bounties[0][msg.sender]);

		return true;
	}


	// Withdrwa ETH from bounty
	function bountyWithdrawEther(uint _value) public returns (bool success) {
		require(_value > 0);
	    require(bounties[0][msg.sender] >= _value);

	    bounties[0][msg.sender] = safeSub(bounties[0][msg.sender], _value);

	    require(msg.sender.call.value(_value)());
		BountyWithdraw(0, msg.sender,_value, bounties[0][msg.sender]);

  		return true;
	}

	// Withdraw tokens from bounty1
	function bountyWithdrawToken(address _token, uint _value) public returns (bool success) {
	   require(_token != 0);
	    require(_value > 0);
	    require(bounties[_token][msg.sender] >= _value);

	    bounties[_token][msg.sender] = safeSub(bounties[_token][msg.sender], _value);

	    require(Token(_token).transfer(msg.sender,_value));
		BountyWithdraw(_token, msg.sender, _value, bounties[_token][msg.sender]);

  		return true;
	}

	// Matcher claiming the bounties
	function bountyClaimToken(address _token, address _maker1, address _maker2) public constant returns (bool success){

		uint bounty;

		require(canClaimBounty[_maker1] == msg.sender && canClaimBounty[_maker2] == msg.sender);

		// total bounty
		bounty = safeAdd(bounties[_token][_maker1], bounties[_token][_maker2]);

		// Delete bounties
		bounties[_token][_maker1] = 0;
		bounties[_token][_maker2] = 0;

		// Remove permission from taking bounties
		canClaimBounty[_maker1] = 0x0;
    	canClaimBounty[_maker2] = 0x0;

		require(Token(_token).transfer(msg.sender, bounty));

		BountyClaimed(msg.sender, _maker1,  _maker2, bounty);

		return true;

	}

	//  -----------------------ORDER VERIFICATION AND SETTLEMENT--------------------------


	function isValidSignature( address signer, bytes32 hash, uint8 v, 
	 						   bytes32 r, bytes32 s ) public constant returns (bool success)
    {
        return signer == ecrecover( keccak256("\x19Ethereum Signed Message:\n32", hash),
            						v, r, s  );
    }

    function getOrderHash(address[6] orderAddresses, uint[6] orderValues)
        public
        constant
        returns (bytes32)
    {
        return keccak256(
			              address(this),
			              orderAddresses[0], // maker
			              orderAddresses[1], // taker
			              orderAddresses[2], // makerToken
			              orderAddresses[3], // takerToken
			              orderAddresses[4], // feeRecipient
			              orderValues[0],    // makerTokenAmount
			              orderValues[1],    // takerTokenAmount
			              orderValues[2],    // makerFee
			              orderValues[3],    // takerFee
			              orderValues[4],    // expirationTimestampInSec
			              orderValues[5]     // salt
       				     );
    }

    uint o1price;
    uint o2price;


    function settleMatchProposal( address[6] orderAddresses1,
						           uint[6] orderValues1,
						           uint8 v1,
						           bytes32 r1,
						           bytes32 s1,
						           address[6] orderAddresses2,
						           uint[6] orderValues2,
						           uint8 v2,
						           bytes32 r2,
						           bytes32 s2 ) public constant returns (bool success){

    	Order memory o1 = Order({
						          expirationTimestampInSec: orderValues1[4],
						          orderHash: getOrderHash(orderAddresses1, orderValues1)
							     });


    	Order memory o2 = Order({
						          expirationTimestampInSec: orderValues2[4],
						          orderHash: getOrderHash(orderAddresses2, orderValues2)
							    });

    	// Valid signature
    	require(isValidSignature(orderAddresses1[0], o1.orderHash, v1, r1, s1));
    	require(isValidSignature(orderAddresses2[0], o2.orderHash, v2, r2, s2));

    	// Valid value
    	require(orderAddresses1[1]  == address(0) && orderAddresses2[1] == address(0));
    	require(orderValues1[0] > 0 && orderValues1[1] > 0);
    	require(orderValues2[0] > 0 && orderValues2[1] > 0);

    	// Valid timestamp
    	require(block.timestamp >= o1.expirationTimestampInSec);
    	require(block.timestamp >= o2.expirationTimestampInSec);

    	// Valid funds
    	require(Token(orderAddresses1[2]).balanceOf(orderAddresses1[0]) >= orderValues1[0]);
    	require(Token(orderAddresses2[2]).balanceOf(orderAddresses2[0]) >= orderValues2[0]);

    	// Compabtible tokens 
    	require(orderAddresses1[2] == orderAddresses2[3] && orderAddresses2[2] == orderAddresses1[3]);

    	// Value overlap 
    	o1price = safeDiv(orderValues1[0], orderValues1[1]);
    	o2price = safeDiv(orderValues2[1], orderValues2[0]);

    	// Make sure there is an overlap in price
    	require(o1price > o2price);

    	// Same smart contract
    	require(orderAddresses1[5] == orderAddresses2[5]);

    	// Giving permission to Matcher from taking bounties
    	canClaimBounty[orderAddresses1[0]] = msg.sender;
    	canClaimBounty[orderAddresses2[0]] = msg.sender;

    	// 
    	MatchFound(msg.sender, orderAddresses1[0], orderAddresses2[0]);

    	return true;
    }

}



    // Mapping a smart contract with its order validation smart contract
    // function assignOrderValidationContract(address _mainContract, address _orderValidationContract) public return (bool success) {

    //	externalOwner = 

    //}


	//  ---------------------BOUNDS FOR MATCHER INTEGRETY ---------------------------------
	/*
	modifier boundWithdrawAllowed() {

		require(boundsWithdrawUnlockPeriod[msg.sender] != 0x0);
		require(now > boundsWithdrawUnlockPeriod[msg.sender]);
		_;

	}

	// Deposit ETH in contract
	function depositBound() public payable returns(bool success) {

		require(msg.value > 0);

		//Adding to current bound
		bounds[msg.sender] += bounds[msg.sender] + msg.value;

		return true;
	}

	// Starting the timer to allow bound withdraw
	function boundWithdrawRequest(uint256 _value) public returns (bool success) {

		require(_value > 0);
		require(bounds[msg.sender] >= _value);

		boundsWithdrawUnlockPeriod[msg.sender] = now + boundsWithdrawPendingPeriod;
		bonudsWithdrawApprovedValue[msg.sender] = _value;

		BoundwithdrawRequest(msg.sender, _value);

		return true;
	}

	// withdraw of bounds
	function boundWithdraw(uint256 _value) public boundWithdrawAllowed returns (bool success){

		require(_value > 0);
		require(bonudsWithdrawApprovedValue[msg.sender] >= _value);

		// Reset boundsWithdrawUnlockPeriod
		boundsWithdrawUnlockPeriod[msg.sender] = 0x0;

		// Updating bound of Matcher
		bounds[msg.sender] -= _value;

		// Sending value to matcher
		require(msg.sender.send(_value));

		// Push event
		Boundwithdraw(msg.sender, _value);

		return true;

	}
	*/
