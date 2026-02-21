def test_main_module():
    """Test main module can be imported"""
    import main
    assert hasattr(main, 'app')
