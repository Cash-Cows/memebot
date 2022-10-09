// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @dev USDT mock token
 */
contract MockMilk is ERC20 {
  /**
   * @dev Sets the name and symbol. Grants `DEFAULT_ADMIN_ROLE` to 
   * the account that deploys the contract.
   */
  constructor() ERC20("Mock Milk", "MILK") {}

  // ============ Write Methods ============

  /**
   * @dev Destroys `amount` tokens from the caller.
   */
  function burn(uint256 amount) external {
    _burn(_msgSender(), amount);
  }

  /**
   * @dev Destroys `amount` tokens from `account`, deducting from 
   * the caller's allowance.
   */
  function burnFrom(address account, uint256 amount) external {
    _burn(account, amount);
  }

  /**
   * @dev Creates `amount` new tokens.
   */
  function mint(address to, uint256 amount) external {
    _mint(to, amount);
  }
}
