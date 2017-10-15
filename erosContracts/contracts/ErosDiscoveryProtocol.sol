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

	address public owner; //Contract owner

	// mapping (address => uint256) bounds; //Bounds for Matchers
	// mapping (address => uint256) boundsWithdrawUnlockPeriod;  //When matcher can unlock bounds funds
	// mapping (address => uint256) bonudsWithdrawApprovedValue; //When matcher can unlock bounds funds

	mapping (address => mapping (address => uint256)) public bounties; // Mapping of token addresses to mapping of account balances for
	mapping (address => uint256) bountyWithdrawUnlockPeriod;  //When user can unlock bounty funds
	mapping (address => uint256) bonutyWithdrawApprovedValue; //When user can unlock bounty funds
	
	
	// uint32 boundsWithdrawPendingPeriod = 30 days;    //_value of time before bounds can be withdrawn
	uint32 bountyWithdrawPendingPeriod = 30 minutes; //_value of time before bounties (matching fees) can be withdrawn

	// uint8 boundPenality = 50; // Percentage of bound lost when infractiong happen

	function ErosJuridistiction() {
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

	//  ---------------------FEE DEPOSIT AND ORDER SETTLEMENT ---------------------------------

	function depositEtherBounty() public payable returns (bool success) {
	  	
	  	require(msg.value > 0);

	    bounties[0][msg.sender] = safeAdd(bounties[0][msg.sender], msg.value);
	    BountyDeposit(0, msg.sender, msg.value, bounties[0][msg.sender]);

	    return true;
	}


	function depositTokenBounty(address _token, uint _value) public returns (bool success) {

		require(_value > 0);
	    require(Token(_token).transferFrom(msg.sender, this, _value));

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
	function bountyWithdrawEther(uint _value) public bountyWithdrawAllowed returns (bool success) {
		require(_value > 0);
	    require(bounties[0][msg.sender] >= _value);

	    bounties[0][msg.sender] = safeSub(bounties[0][msg.sender], _value);

	    require(msg.sender.call.value(_value)());
		BountyWithdraw(0, msg.sender,_value, bounties[0][msg.sender]);

  		return true;
	}

	// Withdraw tokens from bounty
	function bountyWithdrawToken(address _token, uint _value) public bountyWithdrawAllowed returns (bool success) {
	    require(_token != 0);
	    require(_value > 0);
	    require(bounties[_token][msg.sender] >= _value);

	    bounties[_token][msg.sender] = safeSub(bounties[_token][msg.sender], _value);

	    require(Token(_token).transfer(msg.sender,_value));
		BountyWithdraw(_token, msg.sender, _value, bounties[_token][msg.sender]);

  		return true;
	}


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
	
}
